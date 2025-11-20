import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Breakdown from './components/Breakdown';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import { loadConfig, saveConfig, exportConfig, importConfig, clearConfig, saveAllocation, loadAllocation } from './lib/storage';
import { trackAction } from './lib/observability';
import { loadTheme, saveTheme, getThemeColors, type Theme } from './lib/theme';
import { trackSession, trackEvent } from './lib/analytics';
import { formatCurrency } from './lib/formatters';
import { allocatePaycheck, type AllocationResult } from './lib/allocations';
import type { UserConfig } from './lib/types';

export default function App() {
  const [config, setConfig] = useState<UserConfig>(loadConfig());
  const [toastState, setToastState] = useState<{
    show: boolean;
    message: string;
    variant: 'success' | 'error' | 'warning' | 'info';
  }>({ show: false, message: '', variant: 'success' });
  const [lastSavedAt, setLastSavedAt] = useState(() => Date.now());
  const [activeView, setActiveView] = useState<'spend' | 'breakdown' | 'plan'>('spend');
  const [lastAllocation, setLastAllocation] = useState<AllocationResult | null>(() => loadAllocation());
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'clear' | 'import' | null;
    importData?: string;
  }>({ isOpen: false, action: null });

  const colors = getThemeColors(theme);

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveTheme(newTheme);
    trackEvent('themeToggles');
    trackAction('toggle_theme', { theme: newTheme });
  };

  // Config loaded on mount via useState initializer, no need for redundant useEffect

  // Persist allocation result whenever it changes
  useEffect(() => {
    saveAllocation(lastAllocation);
  }, [lastAllocation]);

  useEffect(() => {
    // Track session on app load (privacy-friendly, local only)
    trackSession();

    // handle responsive layout
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showToast = (
    message: string,
    variant: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) => {
    setToastState({ show: true, message, variant });
  };

  const handleSave = (c: UserConfig) => {
    try {
      saveConfig(c);
      setConfig(c);
      setLastSavedAt(Date.now());
      showToast('Configuration saved');
      trackEvent('configSaves');
      trackAction('save_config', {
        bills: c.bills.length,
        goals: c.goals.length,
        bonuses: c.bonuses.length,
      });
    } catch (err) {
      showToast('Failed to save configuration. Check browser storage.', 'error');
      console.error('Save failed:', err);
    }
  };

  const handleQuickPaycheck = (amount: number) => {
    // Auto-adjust range if paycheck is outside current range
    const currentRange = config.settings.paycheckRange;
    let updated = false;
    let newMin = currentRange.min;
    let newMax = currentRange.max;

    if (amount < currentRange.min) {
      newMin = amount;
      updated = true;
    }
    if (amount > currentRange.max) {
      newMax = amount;
      updated = true;
    }

    if (updated) {
      const updatedConfig = {
        ...config,
        settings: {
          ...config.settings,
          paycheckRange: { min: newMin, max: newMax },
        },
      };
      saveConfig(updatedConfig);
      setConfig(updatedConfig);
      
      if (newMin !== currentRange.min) {
        showToast(`Updated min to ${formatCurrency(newMin)}`, 'info');
      }
      if (newMax !== currentRange.max) {
        showToast(`Updated max to ${formatCurrency(newMax)}`, 'info');
      }
    }

    // Process the paycheck using Dashboard's allocation logic
    const settings = updated ? { ...config.settings, paycheckRange: { min: newMin, max: newMax } } : config.settings;
    const percentApply = settings?.percentApply ?? 'gross';
    const upcomingDays = settings?.payFrequency === 'weekly'
      ? 7
      : settings?.payFrequency === 'monthly'
      ? 30
      : 14;

    try {
      const result = allocatePaycheck(amount, config.bills, config.goals, {
        percentApply,
        bonuses: config.bonuses,
        paycheckRange: settings.paycheckRange,
        nextPaycheckDate: settings.nextPaycheckDate,
        upcomingDays,
      });
      setLastAllocation(result);
      setActiveView('spend'); // Switch to main view to see results
      showToast(`Paycheck allocated! You have ${formatCurrency(result.guilt_free)} guilt-free!`, 'success');
      trackEvent('paycheckCalculations');
      trackAction('run_allocation', { paycheck: amount, guilt_free: result.guilt_free });
    } catch (err) {
      showToast('Failed to process paycheck', 'error');
      console.error('Allocation error:', err);
    }
  };

  const handleRangeUpdate = (newMin: number, newMax: number) => {
    const currentRange = config.settings.paycheckRange;
    const updatedConfig = {
      ...config,
      settings: {
        ...config.settings,
        paycheckRange: { min: newMin, max: newMax },
      },
    };
    saveConfig(updatedConfig);
    setConfig(updatedConfig);
    
    if (newMin !== currentRange.min) {
      showToast(`Updated min to ${formatCurrency(newMin)}`, 'info');
    }
    if (newMax !== currentRange.max) {
      showToast(`Updated max to ${formatCurrency(newMax)}`, 'info');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.bodyBg,
        padding: isMobile ? '8px' : '20px',
        transition: 'background 0.3s ease',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          background: colors.cardBg,
          borderRadius: isMobile ? 16 : 24,
          padding: isMobile ? '16px' : '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          transition: 'background 0.3s ease',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <Header lastAllocation={lastAllocation} theme={theme} onToggleTheme={toggleTheme} />

        <nav
          role="tablist"
          aria-label="Main navigation"
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 24,
            background: colors.surfaceBg,
            padding: 8,
            borderRadius: 16,
            transition: 'background 0.3s ease',
          }}
        >
          {[
            { 
              id: 'spend', 
              label: lastAllocation 
                ? `💚 $${lastAllocation.guilt_free.toFixed(0)} Guilt-Free` 
                : '💰 I Got Paid' 
            },
            { 
              id: 'breakdown', 
              label: '🌊 See Waterfall',
              disabled: !lastAllocation
            },
            { id: 'plan', label: '⚙️ Plan & Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeView === tab.id}
              aria-controls={`${tab.id}-panel`}
              onClick={() => {
                if (!('disabled' in tab) || !tab.disabled) {
                  setActiveView(tab.id as 'spend' | 'breakdown' | 'plan');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  // Cycle through enabled tabs
                  if (lastAllocation) {
                    const views: Array<'spend' | 'breakdown' | 'plan'> = ['spend', 'breakdown', 'plan'];
                    const currentIndex = views.indexOf(activeView);
                    const nextIndex = e.key === 'ArrowRight' 
                      ? (currentIndex + 1) % views.length
                      : (currentIndex - 1 + views.length) % views.length;
                    setActiveView(views[nextIndex]);
                  } else {
                    setActiveView(activeView === 'spend' ? 'plan' : 'spend');
                  }
                }
              }}
              disabled={'disabled' in tab && tab.disabled}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: 12,
                border: 'none',
                background: activeView === tab.id ? colors.primaryGradient : 'transparent',
                color: ('disabled' in tab && tab.disabled) ? colors.textMuted : (activeView === tab.id ? '#fff' : colors.textSecondary),
                cursor: ('disabled' in tab && tab.disabled) ? 'not-allowed' : 'pointer',
                fontWeight: activeView === tab.id ? 600 : 500,
                fontSize: 15,
                transition: 'all 0.2s ease',
                boxShadow: activeView === tab.id ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
                minHeight: 44,
                opacity: ('disabled' in tab && tab.disabled) ? 0.5 : 1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 300px',
            gap: 24,
          }}
        >
          <div
            id={`${activeView}-panel`}
            role="tabpanel"
            aria-labelledby={`${activeView}-tab`}
            tabIndex={0}
          >
            {activeView === 'plan' ? (
              <Onboarding
                initial={config}
                onSave={handleSave}
                lastSavedAt={lastSavedAt}
                theme={theme}
                guiltFree={lastAllocation?.guilt_free}
                onNewPaycheck={handleQuickPaycheck}
              />
            ) : activeView === 'breakdown' ? (
              lastAllocation ? (
                <Breakdown allocation={lastAllocation} config={config} theme={theme} onNewPaycheck={handleQuickPaycheck} />
              ) : (
                <div style={{ padding: 48, textAlign: 'center', color: colors.textMuted }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No results yet!</div>
                  <div style={{ fontSize: 14 }}>Go to &ldquo;I Got Paid&rdquo; and enter your paycheck amount first.</div>
                </div>
              )
            ) : (
              <Dashboard config={config} onResult={setLastAllocation} theme={theme} initialResult={lastAllocation} onRangeUpdate={handleRangeUpdate} />
            )}
          </div>
          <aside aria-label="Sidebar">
            <div
              style={{
                background: colors.statusGradient,
                padding: 20,
                borderRadius: 16,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                color: '#fff',
              }}
            >
              <h4
                style={{
                  marginTop: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  opacity: 0.9,
                }}
              >
                Status
              </h4>
              <div aria-live="polite" style={{ fontSize: 16, fontWeight: 500 }}>
                {toastState.show && toastState.variant === 'success' ? '✓ Saved' : 'No changes'}
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                background: colors.cardBg,
                padding: 20,
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: `1px solid ${colors.border}`,
                transition: 'all 0.3s ease',
              }}
            >
              <h4
                style={{
                  marginTop: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.textPrimary,
                  marginBottom: 16,
                }}
              >
                Data Management
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => {
                    const data = exportConfig();
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `payflow_config_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    trackEvent('configExports');
                    trackAction('export_config');
                  }}
                  aria-label="Export configuration as JSON file"
                  style={{
                    padding: '10px 16px',
                    background: colors.surfaceBg,
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                    color: colors.textPrimary,
                    transition: 'all 0.2s ease',
                    minHeight: 44,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.surfaceBg;
                  }}
                >
                  📥 Export config
                </button>

                <label
                  style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: colors.textPrimary }}>
                    📤 Import config
                  </span>
                  <input
                    type="file"
                    accept="application/json"
                    aria-label="Import configuration from JSON file"
                    style={{ fontSize: 13, minHeight: 44 }}
                    onChange={async (e) => {
                      const f = e.target.files && e.target.files[0];
                      if (!f) return;
                      const text = await f.text();
                      setConfirmModal({ isOpen: true, action: 'import', importData: text });
                      e.target.value = ''; // Reset file input
                    }}
                  />
                </label>

                <button
                  onClick={() => setConfirmModal({ isOpen: true, action: 'clear' })}
                  aria-label="Clear all configuration data"
                  style={{
                    padding: '10px 16px',
                    background: colors.errorBg,
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                    color: colors.error,
                    transition: 'all 0.2s ease',
                    minHeight: 44,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  🗑️ Clear config
                </button>
              </div>
            </div>
          </aside>
        </div>
        {toastState.show ? (
          <Toast
            message={toastState.message}
            variant={toastState.variant}
            onDismiss={() => setToastState({ show: false, message: '', variant: 'success' })}
          />
        ) : null}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.action === 'clear' ? 'Clear Configuration?' : 'Import Configuration?'}
          message={
            confirmModal.action === 'clear'
              ? 'This will delete all your bills, goals, and settings. Make sure you have exported your config if you want to keep it.'
              : 'This will replace your current configuration. Your existing bills and goals will be lost unless you have exported them.'
          }
          confirmText={confirmModal.action === 'clear' ? 'Clear All Data' : 'Import'}
          cancelText="Cancel"
          variant="danger"
          theme={theme}
          onConfirm={() => {
            if (confirmModal.action === 'clear') {
              try {
                const next = clearConfig();
                setConfig(next);
                setLastAllocation(null); // Clear allocation result too
                setLastSavedAt(Date.now());
                showToast('Configuration cleared');
                trackAction('clear_config');
              } catch (err) {
                showToast('Failed to clear configuration', 'error');
                console.error('Clear failed:', err);
              }
            } else if (confirmModal.action === 'import' && confirmModal.importData) {
              const imported = importConfig(confirmModal.importData);
              if (imported) {
                setConfig(imported);
                setLastSavedAt(Date.now());
                showToast('Configuration imported successfully');
                trackAction('import_config');
              } else {
                showToast(
                  'Invalid config file. The file may be corrupted or in the wrong format.',
                  'error'
                );
              }
            }
            setConfirmModal({ isOpen: false, action: null });
          }}
          onCancel={() => setConfirmModal({ isOpen: false, action: null })}
        />

        {/* Footer with feedback link */}
        <footer
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: `1px solid ${colors.border}`,
            textAlign: 'center',
            color: colors.textMuted,
            fontSize: 14,
          }}
        >
          <p style={{ marginBottom: 12 }}>
            PayFlow is 100% free, privacy-first, and runs entirely in your browser.
          </p>
          <p style={{ marginBottom: 12 }}>
            <a
              href="mailto:feedback@payflow.app?subject=PayFlow%20Feedback"
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              📬 Send Feedback
            </a>
            {' · '}
            <a
              href="https://github.com/blairmichaelg/paycheck_waterfall_app"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              💻 View Source
            </a>
          </p>
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            Because we all deserve peace
          </p>
        </footer>
      </div>
    </div>
  );
}
