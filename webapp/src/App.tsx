import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Breakdown from './components/Breakdown';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import WelcomeModal from './components/WelcomeModal';
import { loadConfig, saveConfig, exportConfig, importConfig, clearConfig, saveAllocation, loadAllocation, backupConfig, restoreConfigFromBackup, hasValidBackup } from './lib/storage';
import { trackAction } from './lib/observability';
import { loadTheme, saveTheme, getThemeColors, type Theme } from './lib/theme';
import { trackSession, trackEvent } from './lib/analytics';
import { formatCurrency } from './lib/formatters';
import { allocatePaycheck, type AllocationResult } from './lib/allocations';
import type { UserConfig } from './lib/types';
import { getErrorMessage, type ErrorType } from './lib/errorMessages';

export default function App() {
  const [config, setConfig] = useState<UserConfig>(() => {
    const result = loadConfig();
    // Show toast if there was a migration or error
    if (result.migrated) {
      setTimeout(() => showToast('Your settings were updated to the latest version!', 'info'), 500);
    }
    if (result.error) {
      const errorMsg = getErrorMessage(result.error);
      setTimeout(() => showToast(`${errorMsg.icon} ${errorMsg.message}`, 'warning'), 500);
    }
    return result.config;
  });
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
  const [showWelcome, setShowWelcome] = useState(() => {
    const hasSeenWelcome = localStorage.getItem('payflow_seen_welcome');
    const hasNoBills = config.bills.length === 0;
    const hasNoGoals = config.goals.length === 0;
    return !hasSeenWelcome && hasNoBills && hasNoGoals;
  });
  const [backupAvailable, setBackupAvailable] = useState(() => hasValidBackup().exists);

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
    const saveResult = saveConfig(c);
    if (saveResult.success) {
      setConfig(c);
      setLastSavedAt(Date.now());
      showToast('💾 Configuration saved!', 'success');
      trackEvent('configSaves');
      trackAction('save_config', {
        bills: c.bills.length,
        goals: c.goals.length,
        bonuses: c.bonuses.length,
      });
    } else {
      const errorMsg = getErrorMessage(saveResult.error || 'SAVE_FAILED');
      showToast(`${errorMsg.icon} ${errorMsg.message}`, 'error');
      console.error('Save failed:', saveResult.error);
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
                ? (isMobile ? `💚 $${lastAllocation.guilt_free.toFixed(0)}` : `💚 $${lastAllocation.guilt_free.toFixed(0)} Guilt-Free`)
                : (isMobile ? '💰 Got Paid' : '💰 I Got Paid')
            },
            { 
              id: 'breakdown', 
              label: isMobile ? '🌊 Waterfall' : '🌊 See Waterfall',
              disabled: !lastAllocation
            },
            { id: 'plan', label: isMobile ? '⚙️ Settings' : '⚙️ Plan & Settings' },
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

        {/* Backup Restoration Banner */}
        {backupAvailable && activeView === 'plan' && (
          <div
            style={{
              background: colors.successBg,
              padding: isMobile ? 12 : 16,
              borderRadius: 12,
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              border: `2px solid ${colors.success}`,
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <span style={{ fontSize: 24 }}>💾</span>
              <div>
                <div style={{ color: colors.success, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                  Backup Available
                </div>
                <div style={{ color: colors.textSecondary, fontSize: 13 }}>
                  We saved your last settings (available for 24 hours)
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                const restored = restoreConfigFromBackup();
                if (restored) {
                  const loadResult = loadConfig();
                  setConfig(loadResult.config);
                  setLastSavedAt(Date.now());
                  setBackupAvailable(false);
                  showToast('✨ Settings restored successfully!', 'success');
                  trackAction('restore_config_banner');
                } else {
                  const errorMsg = getErrorMessage('LOAD_FAILED');
                  showToast(`${errorMsg.icon} ${errorMsg.message}`, 'error');
                }
              }}
              style={{
                padding: '10px 20px',
                background: colors.success,
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                minHeight: 44,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Restore Settings
            </button>
          </div>
        )}

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
            style={{
              animation: 'fadeIn 0.3s ease',
            }}
          >
            {activeView === 'plan' ? (
              <Onboarding
                initial={config}
                onSave={handleSave}
                lastSavedAt={lastSavedAt}
                theme={theme}
              />
            ) : activeView === 'breakdown' ? (
              lastAllocation ? (
                <Breakdown allocation={lastAllocation} config={config} theme={theme} onNewPaycheck={handleQuickPaycheck} />
              ) : (
                <div style={{ padding: isMobile ? 24 : 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🌊</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>
                    Your Waterfall Awaits!
                  </div>
                  <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                    See how your paycheck flows through bills and goals like a waterfall. Run a calculation first!
                  </div>
                  
                  {/* Preview mockup */}
                  <div style={{ maxWidth: 500, margin: '0 auto', opacity: 0.6 }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 16,
                      padding: '16px 24px',
                      marginBottom: 12,
                      border: '2px dashed rgba(102, 126, 234, 0.4)'
                    }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>💰 Your Paycheck</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>$X,XXX.XX</div>
                    </div>
                    
                    <div style={{ fontSize: 20, margin: '8px 0' }}>💧</div>
                    
                    <div style={{ 
                      background: colors.surfaceBg,
                      borderRadius: 12,
                      padding: '12px 16px',
                      marginBottom: 8,
                      border: `2px dashed ${colors.border}`
                    }}>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>📋 Bills</div>
                    </div>
                    
                    <div style={{ fontSize: 20, margin: '8px 0' }}>💧</div>
                    
                    <div style={{ 
                      background: colors.surfaceBg,
                      borderRadius: 12,
                      padding: '12px 16px',
                      marginBottom: 8,
                      border: `2px dashed ${colors.border}`
                    }}>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>🎯 Goals</div>
                    </div>
                    
                    <div style={{ fontSize: 20, margin: '8px 0' }}>💧</div>
                    
                    <div style={{ 
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: 16,
                      padding: '16px 24px',
                      border: '2px dashed rgba(16, 185, 129, 0.4)'
                    }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>💚 Guilt-Free</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>$XXX.XX</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setActiveView('spend')}
                    style={{
                      marginTop: 32,
                      padding: '12px 24px',
                      background: colors.primaryGradient,
                      border: 'none',
                      borderRadius: 12,
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                      minHeight: 44,
                    }}
                  >
                    Go Calculate Now →
                  </button>
                </div>
              )
            ) : (
              <Dashboard config={config} onResult={setLastAllocation} theme={theme} initialResult={lastAllocation} onRangeUpdate={handleRangeUpdate} />
            )}
          </div>
          <aside aria-label="Sidebar">
            {activeView === 'plan' ? (
              // Full sidebar for settings view
              <>
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
                      Export Config
                    </button>

                    <label
                      style={{ display: 'block', cursor: 'pointer' }}
                    >
                      <input
                        type="file"
                        accept="application/json"
                        aria-label="Import configuration from JSON file"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const f = e.target.files && e.target.files[0];
                          if (!f) return;
                          const text = await f.text();
                          setConfirmModal({ isOpen: true, action: 'import', importData: text });
                          e.target.value = ''; // Reset file input
                        }}
                      />
                      <div
                        style={{
                          padding: '10px 16px',
                          background: colors.surfaceBg,
                          border: 'none',
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: 500,
                          color: colors.textPrimary,
                          transition: 'all 0.2s ease',
                          minHeight: 44,
                          textAlign: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.border;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = colors.surfaceBg;
                        }}
                      >
                        Import Config
                      </div>
                    </label>

                    {backupAvailable && (
                      <button
                        onClick={() => {
                          const restored = restoreConfigFromBackup();
                          if (restored) {
                            const loadResult = loadConfig();
                            setConfig(loadResult.config);
                            setLastSavedAt(Date.now());
                            setBackupAvailable(false);
                            showToast('✨ Configuration restored successfully!', 'success');
                            trackAction('restore_config');
                          } else {
                            const errorMsg = getErrorMessage('LOAD_FAILED');
                            showToast(`${errorMsg.icon} ${errorMsg.message}`, 'error');
                          }
                        }}
                        aria-label="Restore last configuration"
                        style={{
                          padding: '10px 16px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          borderRadius: 10,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#fff',
                          transition: 'all 0.2s ease',
                          minHeight: 44,
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                        }}
                      >
                        ↺ Restore Last Config
                      </button>
                    )}

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
                      Clear Config
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Compact sidebar for other views
              <div
                style={{
                  background: colors.cardBg,
                  padding: 16,
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.3s ease',
                }}
              >
                <h4
                  style={{
                    marginTop: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.textMuted,
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Quick Actions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                    aria-label="Export configuration"
                    style={{
                      padding: '8px 12px',
                      background: colors.surfaceBg,
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      color: colors.textSecondary,
                      transition: 'all 0.2s ease',
                      minHeight: 36,
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.border;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colors.surfaceBg;
                    }}
                  >
                    Export
                  </button>
                  <button
                    onClick={() => setActiveView('plan')}
                    style={{
                      padding: '8px 12px',
                      background: colors.surfaceBg,
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      color: colors.textSecondary,
                      transition: 'all 0.2s ease',
                      minHeight: 36,
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.border;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colors.surfaceBg;
                    }}
                  >
                    Settings
                  </button>
                </div>
              </div>
            )}
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
                backupConfig(); // Create backup before clearing
                const next = clearConfig();
                setConfig(next);
                setLastAllocation(null); // Clear allocation result too
                setLastSavedAt(Date.now());
                setBackupAvailable(true);
                showToast('Configuration cleared. You can restore it within 24 hours.', 'success');
                trackAction('clear_config');
              } catch (err) {
                showToast('Failed to clear configuration', 'error');
                console.error('Clear failed:', err);
              }
            } else if (confirmModal.action === 'import' && confirmModal.importData) {
              const importResult = importConfig(confirmModal.importData);
              if (importResult.success && importResult.config) {
                setConfig(importResult.config);
                setLastSavedAt(Date.now());
                showToast('✨ Configuration imported successfully!', 'success');
                trackAction('import_config');
              } else {
                const errorMsg = getErrorMessage(importResult.error || 'IMPORT_FAILED');
                showToast(
                  `${errorMsg.icon} ${errorMsg.message}`,
                  'error'
                );
              }
            }
            setConfirmModal({ isOpen: false, action: null });
          }}
          onCancel={() => setConfirmModal({ isOpen: false, action: null })}
        />

        <WelcomeModal
          isOpen={showWelcome}
          theme={theme}
          onClose={() => {
            setShowWelcome(false);
            localStorage.setItem('payflow_seen_welcome', 'true');
          }}
          onGoToSettings={() => {
            setActiveView('plan');
            localStorage.setItem('payflow_seen_welcome', 'true');
          }}
        />

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

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
              Send Feedback
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
              View Source
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
