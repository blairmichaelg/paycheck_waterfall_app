import React, { useState, useEffect, useRef } from 'react';
import { allocatePaycheck } from '../lib/allocations';
import { trackEvent } from '../lib/analytics';
import { getThemeColors, type Theme } from '../lib/theme';
import { formatCurrency } from '../lib/formatters';
import { getErrorMessage } from '../lib/errorMessages';
import { useIsMobile } from '../lib/hooks';
import type { AllocationResult } from '../lib/allocations';
import type { UserConfig } from '../lib/types';

export default function Dashboard({
  config,
  onResult,
  theme,
  initialResult,
  onRangeUpdate,
  _onConfigUpdate,
  onToast,
}: {
  config: UserConfig;
  onResult?: (result: AllocationResult) => void;
  theme: Theme;
  initialResult?: AllocationResult | null;
  onRangeUpdate?: (min: number, max: number) => void;
  _onConfigUpdate?: (config: UserConfig) => void;
  onToast?: (message: string, variant?: 'success' | 'error' | 'warning' | 'info') => void;
}) {
  const colors = getThemeColors(theme);
  const [lastResult, setLastResult] = useState<AllocationResult | null>(initialResult ?? null);
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const isMobile = useIsMobile();
  const [isCalculating, setIsCalculating] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const settings = config.settings;
  const percentApply = settings?.percentApply ?? 'gross';
  const percentApplyLabel =
    percentApply === 'gross' ? 'Gross paycheck' : 'Paycheck remainder after bills';

  // Sync with external result changes (e.g., when switching back to this tab)
  useEffect(() => {
    if (initialResult) {
      setLastResult(initialResult);
    }
  }, [initialResult]);

  const run = () => {
    const parsed = Number(amountInput.replace(/[^0-9.]/g, ''));
    if (!parsed || parsed <= 0) {
      const errorMsg = getErrorMessage('INVALID_AMOUNT');
      setError(`${errorMsg.icon} ${errorMsg.message}`);
      setLastResult(null);
      return;
    }
    setError(null);
    setIsCalculating(true);

    // Auto-adjust range if needed
    const currentRange = settings.paycheckRange;
    if (onRangeUpdate && (parsed < currentRange.min || parsed > currentRange.max)) {
      const newMin = Math.min(parsed, currentRange.min);
      const newMax = Math.max(parsed, currentRange.max);
      onRangeUpdate(newMin, newMax);
      // Show transparent feedback about range adjustment
      if (onToast) {
        onToast(
          `✨ Paycheck range auto-adjusted to ${formatCurrency(newMin)} - ${formatCurrency(
            newMax
          )}`,
          'info'
        );
      }
    }

    // Use setTimeout to allow UI to update with loading state
    setTimeout(() => {
      try {
        const res = allocatePaycheck(parsed, config.bills, config.goals, {
          percentApply,
          payFrequency: settings?.payFrequency,
          paycheckRange: settings?.paycheckRange,
          bonuses: config.bonuses,
          nextPaycheckDate: settings?.nextPaycheckDate,
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

        // Move focus to result for screen readers
        setTimeout(() => {
          resultRef.current?.focus();
        }, 100);
      } catch (err) {
        const errorMsg = getErrorMessage('CALCULATION_FAILED');
        setError(`${errorMsg.icon} ${errorMsg.message}`);
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
          background: colors.surfaceBg,
          padding: isMobile ? 16 : 24,
          borderRadius: 16,
          border: `2px solid ${colors.border}`,
          transition: 'background 0.3s ease',
        }}
      >
        <label style={{ display: 'block' }}>
          <span
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: colors.textPrimary,
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
              onChange={(e) => {
                const value = e.target.value;
                // Allow only numbers and a single decimal point
                if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                  setAmountInput(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCalculating) {
                  run();
                }
              }}
              placeholder="e.g. 850"
              style={{
                flex: isMobile ? '1 1 58%' : '1',
                padding: '14px 18px',
                borderRadius: 12,
                border: '2px solid rgba(255,255,255,0.8)',
                fontSize: 18,
                fontWeight: 600,
                background: '#fff',
                color: '#1f2937',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                outline: 'none',
                minWidth: isMobile ? '120px' : 'auto',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                if (isMobile) {
                  setTimeout(() => {
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 300);
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
              }}
            />
            <button
              onClick={run}
              disabled={isCalculating}
              style={{
                padding: isMobile ? '12px 16px' : '18px 36px',
                borderRadius: 14,
                border: 'none',
                background: isCalculating
                  ? colors.border
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontWeight: 800,
                fontSize: isMobile ? 15 : 18,
                boxShadow: isCalculating
                  ? '0 4px 12px rgba(0,0,0,0.1)'
                  : '0 8px 28px rgba(16, 185, 129, 0.5)',
                cursor: isCalculating ? 'wait' : 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                minHeight: '52px',
                flex: isMobile ? '1 1 38%' : 'none',
                minWidth: isMobile ? '100px' : '180px',
                opacity: isCalculating ? 0.7 : 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                letterSpacing: '0.5px',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isCalculating) {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 36px rgba(16, 185, 129, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCalculating) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(16, 185, 129, 0.5)';
                }
              }}
            >
              {isCalculating
                ? '⏳ Calculating...'
                : isMobile
                ? '🎉 Got Paid!'
                : '🎉 I Got Paid!! 💰'}
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
            ref={resultRef}
            tabIndex={-1}
            aria-live="polite"
            aria-label="Calculation complete"
            style={{
              background: colors.successGradient,
              borderRadius: 20,
              padding: isMobile ? 20 : 28,
              boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4)',
              border: '2px solid rgba(255,255,255,0.2)',
              transition: 'background 0.3s ease',
              outline: 'none',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                opacity: 0.95,
              }}
            >
              Your Guilt-Free Spending 💚
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: '#ffffff',
                marginTop: 8,
                textShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {formatCurrency(lastResult.guilt_free)}
            </div>

            {/* Positive message when guilt-free is zero */}
            {lastResult.guilt_free === 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  fontSize: 14,
                  color: '#ffffff',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                💪 Hang in there! Your bills are covered—that&apos;s what matters.
              </div>
            )}

            {/* Calculation breakdown - Always visible for transparency */}
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.3)',
                fontSize: 13,
                color: 'rgba(255,255,255,0.95)',
                lineHeight: 1.8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.85,
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: 600,
                }}
              >
                🧮 The Math
              </div>
              <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 12, fontStyle: 'italic' }}>
                (Income − Allocated Bills − Goals = Guilt-Free)
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span style={{ opacity: 0.9 }}>💵 Your paycheck</span>
                <strong style={{ fontSize: 14 }}>{formatCurrency(lastResult.meta.paycheck)}</strong>
              </div>
              {lastResult.meta.supplemental_income > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ opacity: 0.9 }}>💰 + Bonus income</span>
                  <strong style={{ fontSize: 14 }}>
                    +{formatCurrency(lastResult.meta.supplemental_income)}
                  </strong>
                </div>
              )}
              {lastResult.meta.supplemental_income > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 6,
                    marginBottom: 8,
                    borderTop: '1px dashed rgba(255,255,255,0.2)',
                    fontSize: 12,
                    opacity: 0.85,
                  }}
                >
                  <span>Total available:</span>
                  <strong>
                    {formatCurrency(lastResult.meta.paycheck + lastResult.meta.supplemental_income)}
                  </strong>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                  marginTop: lastResult.meta.supplemental_income > 0 ? 0 : 8,
                }}
              >
                <span style={{ opacity: 0.9 }}>
                  🏠 − Bills allocated ({lastResult.bills.length})
                </span>
                <strong style={{ fontSize: 14, color: 'rgba(255,180,180,1)' }}>
                  −{formatCurrency(lastResult.bills.reduce((sum, b) => sum + b.allocated, 0))}
                </strong>
              </div>
              <div
                style={{
                  fontSize: 11,
                  textAlign: 'right',
                  marginTop: -4,
                  marginBottom: 4,
                  opacity: 0.8,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const el = document.getElementById('bills-breakdown');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                See details ↓
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span style={{ opacity: 0.9 }}>
                  🎯 − Goals allocated ({lastResult.goals.length})
                </span>
                <strong style={{ fontSize: 14, color: 'rgba(255,180,180,1)' }}>
                  −{formatCurrency(lastResult.goals.reduce((sum, g) => sum + g.allocated, 0))}
                </strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '2px solid rgba(255,255,255,0.4)',
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                <span>💚 Your guilt-free spending</span>
                <strong style={{ fontSize: 16 }}>{formatCurrency(lastResult.guilt_free)}</strong>
              </div>
            </div>
          </div>

          {/* Celebration Banner */}
          {(() => {
            const fullyFundedCount = lastResult.bills.filter((b) => b.remaining === 0).length;
            const totalBills = lastResult.bills.length;

            if (totalBills > 0 && fullyFundedCount === totalBills) {
              return (
                <div
                  style={{
                    background: colors.successBg,
                    padding: isMobile ? 16 : 20,
                    borderRadius: 16,
                    textAlign: 'center',
                    marginBottom: 16,
                    border: `2px solid ${colors.success}`,
                  }}
                >
                  <div style={{ fontSize: isMobile ? 20 : 24, marginBottom: 8 }}>🎉✨🎉</div>
                  <div
                    style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: colors.success }}
                  >
                    All {totalBills} {totalBills === 1 ? 'bill' : 'bills'} fully funded!
                  </div>
                  <div style={{ fontSize: 14, color: colors.textPrimary, marginTop: 4 }}>
                    You&rsquo;re crushing it! 💪
                  </div>
                </div>
              );
            } else if (totalBills > 0 && fullyFundedCount > 0) {
              return (
                <div
                  style={{
                    textAlign: 'center',
                    color: colors.success,
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 12,
                    padding: 12,
                    background: colors.successBg,
                    borderRadius: 12,
                  }}
                >
                  ✨ {fullyFundedCount} of {totalBills} bills ready to go!
                </div>
              );
            }
            return null;
          })()}

          <section
            id="bills-breakdown"
            style={{
              background: colors.cardBg,
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: `1px solid ${colors.border}`,
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <h2
                style={{
                  marginTop: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  marginBottom: 8,
                }}
              >
                📋 Bills Funded This Paycheck
              </h2>
              <div
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  lineHeight: 1.5,
                  padding: '8px 12px',
                  background: colors.successBg,
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                }}
              >
                💡 <strong style={{ color: colors.textPrimary }}>Monthly bills</strong> show the
                full amount when due this month.{' '}
                <strong style={{ color: colors.textPrimary }}>Biweekly/weekly bills</strong> show
                the amount for this paycheck.
              </div>
            </div>
            {lastResult.bills.length === 0 ? (
              <div style={{ color: colors.textMuted }}>No bills configured.</div>
            ) : isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lastResult.bills.map((bill) => {
                  return (
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
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{
                              color: colors.textPrimary,
                              fontWeight: 600,
                              fontSize: 15,
                            }}
                          >
                            {bill.name || 'Bill'}
                          </span>
                          {bill.isUrgent && bill.daysUntilDue !== undefined && (
                            <span
                              style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              📌 Priority ({bill.daysUntilDue}d)
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
                          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 2 }}>
                            Bill Amount
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>
                            {formatCurrency(bill.required)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 2 }}>
                            You&apos;re Saving
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: colors.success }}>
                            {formatCurrency(bill.allocated)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 2 }}>
                            Still Need
                          </div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: bill.remaining > 0 ? colors.textSecondary : colors.success,
                            }}
                          >
                            {bill.remaining > 0 ? formatCurrency(bill.remaining) : '✓ Ready!'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: `2px solid ${colors.border}` }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px 4px',
                        color: colors.textSecondary,
                        fontSize: 13,
                      }}
                    >
                      Name
                    </th>
                    <th style={{ padding: '8px 4px', color: colors.textSecondary, fontSize: 13 }}>
                      Bill Amount
                    </th>
                    <th style={{ padding: '8px 4px', color: colors.textSecondary, fontSize: 13 }}>
                      You&apos;re Saving
                    </th>
                    <th style={{ padding: '8px 4px', color: colors.textSecondary, fontSize: 13 }}>
                      Still Need
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lastResult.bills.map((bill) => {
                    return (
                      <tr
                        key={bill.name}
                        style={{
                          borderBottom: `1px solid ${colors.borderLight}`,
                        }}
                      >
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
                              style={{
                                color: colors.textPrimary,
                                fontWeight: 500,
                                fontSize: 14,
                              }}
                            >
                              {bill.name || 'Bill'}
                            </span>
                            {bill.isUrgent && bill.daysUntilDue !== undefined && (
                              <span
                                style={{
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  padding: '2px 6px',
                                  borderRadius: 6,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                📌 Priority ({bill.daysUntilDue}d)
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
                        <td
                          style={{ padding: '12px 4px', color: colors.textPrimary, fontSize: 14 }}
                        >
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
                            color: bill.remaining > 0 ? colors.textSecondary : colors.success,
                            fontSize: 14,
                          }}
                        >
                          {bill.remaining > 0 ? formatCurrency(bill.remaining) : '✓ Ready!'}
                        </td>
                      </tr>
                    );
                  })}
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
            <h2
              style={{
                marginTop: 0,
                fontSize: 18,
                fontWeight: 700,
                color: colors.textPrimary,
                marginBottom: 16,
              }}
            >
              🎯 Goals
            </h2>
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

          {/* Allocation Explainer */}
          <details
            style={{
              marginTop: 16,
              padding: 16,
              background: colors.surfaceBg,
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                color: colors.textPrimary,
                userSelect: 'none',
                listStyle: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>🤔</span>
              <span>How was this calculated?</span>
            </summary>
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${colors.border}`,
                fontSize: 14,
                lineHeight: 1.7,
                color: colors.textSecondary,
              }}
            >
              <p style={{ margin: '0 0 12px 0', color: colors.textPrimary }}>
                Your paycheck of{' '}
                <strong>{lastResult ? `${lastResult.meta.paycheck.toFixed(2)}` : '0.00'}</strong>{' '}
                was allocated like this:
              </p>
              <ol
                style={{
                  margin: 0,
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>
                  <strong>Monthly bills</strong> are funded for the full amount when due this month
                </li>
                <li>
                  <strong>Bills due soonest</strong> get funded first (reduces stress!)
                </li>
                <li>
                  <strong>Extra money</strong> goes to complete partial bills when possible
                </li>
                <li>
                  <strong>Goals</strong> receive{' '}
                  {percentApply === 'gross'
                    ? 'a percentage of your gross pay'
                    : 'what remains after bills'}
                </li>
                <li>
                  <strong>Everything left</strong> is yours to spend guilt-free! 💚
                </li>
              </ol>
              {lastResult && lastResult.meta.supplemental_income > 0 && (
                <p
                  style={{
                    marginTop: 12,
                    padding: 10,
                    background: colors.successBg,
                    borderRadius: 8,
                    fontSize: 13,
                    color: colors.success,
                  }}
                >
                  💰 <strong>Bonus tip:</strong> We included $
                  {lastResult.meta.supplemental_income.toFixed(2)} in expected bonus income to help
                  fund your bills!
                </p>
              )}
            </div>
          </details>

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
              marginTop: 12,
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
          👆 Enter your paycheck amount above and click the green{' '}
          <strong>&ldquo;I Got Paid!!&rdquo;</strong> button to see your guilt-free spending!
        </div>
      )}
    </div>
  );
}
