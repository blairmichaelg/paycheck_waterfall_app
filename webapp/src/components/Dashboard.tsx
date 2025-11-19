import React, { useState, useEffect } from 'react';
import { allocatePaycheck } from '../lib/allocations';
import { trackAction } from '../lib/observability';
import { trackEvent } from '../lib/analytics';
import { getThemeColors, type Theme } from '../lib/theme';
import type { AllocationResult } from '../lib/allocations';
import type { UserConfig } from '../lib/types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

export default function Dashboard({
  config,
  onResult,
  theme,
}: {
  config: UserConfig;
  onResult?: (result: AllocationResult) => void;
  theme: Theme;
}) {
  const colors = getThemeColors(theme);
  const [lastResult, setLastResult] = useState<AllocationResult | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [isCalculating, setIsCalculating] = useState(false);

  const settings = config.settings;
  const percentApply = settings?.percentApply ?? 'gross';
  const percentApplyLabel =
    percentApply === 'gross' ? 'Gross paycheck' : 'Paycheck remainder after bills';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const run = () => {
    const parsed = Number(amountInput.replace(/[^0-9.]/g, ''));
    if (!parsed || parsed <= 0) {
      setError('Enter a paycheck amount greater than zero');
      setLastResult(null);
      return;
    }
    setError(null);
    setIsCalculating(true);

    // Use setTimeout to allow UI to update with loading state
    setTimeout(() => {
      try {
        const res = allocatePaycheck(parsed, config.bills, config.goals, {
          percentApply,
          payFrequency: settings?.payFrequency,
          paycheckRange: settings?.paycheckRange,
          bonuses: config.bonuses,
          upcomingDays:
            settings?.payFrequency === 'weekly'
              ? 7
              : settings?.payFrequency === 'semi_monthly'
              ? 15
              : settings?.payFrequency === 'monthly'
              ? 30
              : 14, // biweekly default
        });
        setLastResult(res);
        onResult?.(res);
        trackEvent('paycheckCalculations');
        trackAction('run_allocation', { paycheck: parsed, guilt_free: res.guilt_free });
      } catch (err) {
        setError('Calculation failed. Please check your inputs.');
        console.error('Allocation error:', err);
      } finally {
        setIsCalculating(false);
      }
    }, 50);
  };

  return (
    <div>
      <div
        style={{
          background: colors.accentGradient,
          padding: isMobile ? 16 : 24,
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(253, 203, 110, 0.3)',
          transition: 'background 0.3s ease',
        }}
      >
        <label style={{ display: 'block' }}>
          <span
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: theme === 'dark' ? '#1f2937' : '#2d3748',
              marginBottom: 8,
            }}
          >
            💵 Paycheck Amount
          </span>
          <div
            style={{
              display: 'flex',
              gap: isMobile ? 8 : 12,
              alignItems: 'stretch',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
            }}
          >
            <input
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="e.g. 850"
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: 12,
                border: '2px solid rgba(255,255,255,0.8)',
                fontSize: 18,
                fontWeight: 600,
                background: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
              }}
            />
            <button
              onClick={run}
              disabled={isCalculating}
              style={{
                padding: isMobile ? '14px 20px' : '14px 28px',
                borderRadius: 12,
                border: 'none',
                background: isCalculating ? colors.border : colors.primaryGradient,
                color: '#fff',
                fontWeight: 700,
                fontSize: isMobile ? 15 : 16,
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                cursor: isCalculating ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                minHeight: '44px',
                minWidth: isMobile ? '100%' : '120px',
                flex: isMobile ? '1 0 100%' : 'none',
                opacity: isCalculating ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isCalculating) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCalculating) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {isCalculating ? '⏳ Calculating...' : '🎉 I Got Paid!'}
            </button>
          </div>
        </label>
      </div>
      {error ? (
        <div
          style={{
            color: colors.error,
            marginTop: 12,
            padding: 12,
            background: colors.errorBg,
            borderRadius: 10,
            fontSize: 14,
            transition: 'all 0.3s ease',
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          marginTop: 16,
          fontSize: 13,
          color: colors.textSecondary,
          background: colors.surfaceBg,
          padding: 10,
          borderRadius: 10,
          transition: 'all 0.3s ease',
        }}
      >
        📊 Percent goals use:{' '}
        <strong style={{ color: colors.textPrimary }}>{percentApplyLabel}</strong>
      </div>

      {lastResult ? (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              background: colors.warningGradient,
              borderRadius: 20,
              padding: isMobile ? 20 : 28,
              boxShadow: '0 12px 32px rgba(168, 237, 234, 0.4)',
              border: '2px solid rgba(255,255,255,0.8)',
              transition: 'background 0.3s ease',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: theme === 'dark' ? '#f1f5f9' : '#1f2937',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Your Guilt-Free Spending 💚
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginTop: 8,
              }}
            >
              {formatCurrency(lastResult.guilt_free)}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                marginTop: 16,
                fontSize: 13,
                color: theme === 'dark' ? '#f1f5f9' : '#374151',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  color: '#1f2937',
                }}
              >
                💰 Paycheck: {formatCurrency(lastResult.meta.paycheck)}
              </span>
              <span
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  color: '#1f2937',
                }}
              >
                ✅ Effective: {formatCurrency(lastResult.meta.effective_paycheck)}
              </span>
              <span
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  color: '#1f2937',
                }}
              >
                🛡️ Buffer: {lastResult.meta.variance_pct}%
              </span>
            </div>
          </div>

          <section
            style={{
              background: colors.cardBg,
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: `1px solid ${colors.border}`,
              transition: 'all 0.3s ease',
            }}
          >
            <h4
              style={{
                marginTop: 0,
                fontSize: 18,
                fontWeight: 700,
                color: colors.textPrimary,
                marginBottom: 16,
              }}
            >
              📋 Bills Funded This Paycheck
            </h4>
            {lastResult.bills.length === 0 ? (
              <div style={{ color: colors.textMuted }}>No bills configured.</div>
            ) : isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lastResult.bills.map((bill) => (
                  <div
                    key={bill.name}
                    style={{
                      background: colors.surfaceBg,
                      padding: 12,
                      borderRadius: 12,
                      border: `1px solid ${colors.borderLight}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                      >
                        <span style={{ color: colors.textPrimary, fontWeight: 600, fontSize: 15 }}>
                          {bill.name || 'Bill'}
                        </span>
                        {bill.isUrgent && bill.daysUntilDue !== undefined && (
                          <span
                            style={{
                              background: colors.errorBg,
                              color: colors.error,
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ⚠️ {bill.daysUntilDue}d
                          </span>
                        )}
                        {!bill.isUrgent && bill.daysUntilDue !== undefined && (
                          <span
                            style={{
                              background: colors.border,
                              color: colors.textMuted,
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {bill.daysUntilDue}d
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                          Need
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                          {formatCurrency(bill.required)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                          Funded
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: colors.success }}>
                          {formatCurrency(bill.allocated)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                          Still need
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: bill.remaining > 0 ? colors.warning : colors.textMuted,
                          }}
                        >
                          {formatCurrency(bill.remaining)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>
                    <th style={{ padding: '8px 4px', color: colors.textSecondary, fontSize: 13 }}>
                      Name
                    </th>
                    <th style={{ padding: '8px 4px', color: colors.textSecondary, fontSize: 13 }}>
                      Need
                    </th>
                    <th style={{ padding: '8px 4px', color: colors.textSecondary, fontSize: 13 }}>
                      Allocated
                    </th>
                    <th style={{ padding: '8px 4px', color: colors.textSecondary, fontSize: 13 }}>
                      Still need
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lastResult.bills.map((bill) => (
                    <tr key={bill.name} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                      <td style={{ padding: '12px 4px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{ color: colors.textPrimary, fontWeight: 500, fontSize: 14 }}
                          >
                            {bill.name || 'Bill'}
                          </span>
                          {bill.isUrgent && bill.daysUntilDue !== undefined && (
                            <span
                              style={{
                                background: colors.errorBg,
                                color: colors.error,
                                padding: '2px 6px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ⚠️ {bill.daysUntilDue}d
                            </span>
                          )}
                          {!bill.isUrgent && bill.daysUntilDue !== undefined && (
                            <span
                              style={{
                                background: colors.surfaceBg,
                                color: colors.textMuted,
                                padding: '2px 6px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {bill.daysUntilDue}d
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 4px', color: colors.textPrimary, fontSize: 14 }}>
                        {formatCurrency(bill.required)}
                      </td>
                      <td
                        style={{
                          padding: '12px 4px',
                          color: colors.success,
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        {formatCurrency(bill.allocated)}
                      </td>
                      <td
                        style={{
                          padding: '12px 4px',
                          color: bill.remaining > 0 ? colors.warning : colors.textMuted,
                          fontSize: 14,
                        }}
                      >
                        {formatCurrency(bill.remaining)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section
            style={{
              background: colors.cardBg,
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: `1px solid ${colors.border}`,
              transition: 'all 0.3s ease',
            }}
          >
            <h4
              style={{
                marginTop: 0,
                fontSize: 18,
                fontWeight: 700,
                color: colors.textPrimary,
                marginBottom: 16,
              }}
            >
              🎯 Goals
            </h4>
            {lastResult.goals.length === 0 ? (
              <div style={{ color: colors.textMuted }}>No goals configured.</div>
            ) : isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lastResult.goals.map((goal) => (
                  <div
                    key={goal.name}
                    style={{
                      background: colors.surfaceBg,
                      padding: 12,
                      borderRadius: 12,
                      border: `1px solid ${colors.borderLight}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: colors.textPrimary,
                        marginBottom: 8,
                      }}
                    >
                      {goal.name || 'Goal'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                          Desired
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                          {formatCurrency(goal.desired)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                          Allocated
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: colors.success }}>
                          {formatCurrency(goal.allocated)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>
                    <th style={{ padding: '8px 4px', color: colors.textSecondary, fontSize: 13 }}>
                      Name
                    </th>
                    <th style={{ padding: '8px 4px', color: colors.textSecondary, fontSize: 13 }}>
                      Desired
                    </th>
                    <th style={{ padding: '8px 4px', color: colors.textSecondary, fontSize: 13 }}>
                      Allocated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lastResult.goals.map((goal) => (
                    <tr key={goal.name} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                      <td
                        style={{
                          padding: '12px 4px',
                          color: colors.textPrimary,
                          fontWeight: 500,
                          fontSize: 14,
                        }}
                      >
                        {goal.name || 'Goal'}
                      </td>
                      <td style={{ padding: '12px 4px', color: colors.textPrimary, fontSize: 14 }}>
                        {formatCurrency(goal.desired)}
                      </td>
                      <td
                        style={{
                          padding: '12px 4px',
                          color: colors.success,
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        {formatCurrency(goal.allocated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <button
            style={{
              alignSelf: 'flex-start',
              border: 'none',
              background: colors.surfaceBg,
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              minHeight: '44px',
            }}
            onClick={() => setShowDetails((prev) => !prev)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.surfaceBg;
            }}
          >
            {showDetails ? '🔽 Hide raw details' : '🔼 Show raw details'}
          </button>

          {showDetails ? (
            <pre
              style={{
                background: theme === 'dark' ? colors.surfaceBg : '#0f172a',
                color: theme === 'dark' ? colors.textPrimary : '#fff',
                borderRadius: 12,
                padding: 16,
                overflow: 'auto',
                border: `1px solid ${colors.border}`,
              }}
            >
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : (
        <div
          style={{
            marginTop: 24,
            padding: 32,
            textAlign: 'center',
            background: colors.accentGradient,
            borderRadius: 16,
            color: theme === 'dark' ? '#1f2937' : '#2d3748',
            fontSize: 15,
            fontWeight: 500,
            transition: 'background 0.3s ease',
          }}
        >
          👆 Enter your paycheck amount above and click <strong>&ldquo;I Got Paid!&rdquo;</strong>{' '}
          to see your guilt-free spending!
        </div>
      )}
    </div>
  );
}
