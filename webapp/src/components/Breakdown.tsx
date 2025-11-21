import React from 'react';
import { getThemeColors, type Theme } from '../lib/theme';
import { formatCurrency } from '../lib/formatters';
import { useIsMobile } from '../lib/hooks';
import type { AllocationResult } from '../lib/allocations';
import type { UserConfig } from '../lib/types';

type BreakdownProps = {
  allocation: AllocationResult;
  config: UserConfig;
  theme: Theme;
};

// Flow connector component
const FlowConnector = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0' }}>
    <div
      style={{
        width: 4,
        height: 30,
        background:
          'linear-gradient(180deg, rgba(102, 126, 234, 0.4) 0%, rgba(102, 126, 234, 0.15) 100%)',
      }}
    />
    <div style={{ fontSize: 14, margin: '-5px 0' }}>💧</div>
    <div
      style={{
        width: 4,
        height: 30,
        background:
          'linear-gradient(180deg, rgba(102, 126, 234, 0.15) 0%, rgba(102, 126, 234, 0.4) 100%)',
      }}
    />
  </div>
);

export default function Breakdown({ allocation, config, theme }: BreakdownProps) {
  const colors = getThemeColors(theme);
  const isMobile = useIsMobile();
  const settings = config.settings;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        alignItems: 'center',
        maxWidth: 800,
        margin: '0 auto',
        width: '100%',
        padding: isMobile ? '16px' : '24px',
      }}
    >
      {/* SOURCE: Paycheck */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 20,
          padding: isMobile ? '20px 28px' : '24px 40px',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
          border: '3px solid rgba(255,255,255,0.3)',
          textAlign: 'center',
          width: isMobile ? '100%' : '85%',
          maxWidth: 420,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.85)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 8,
          }}
        >
          💰 Source
        </div>
        <div
          style={{
            fontSize: isMobile ? 40 : 52,
            fontWeight: 800,
            color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {formatCurrency(allocation.meta.paycheck)}
        </div>
      </div>

      <FlowConnector />

      {/* BILLS LEVEL */}
      {allocation.bills.length > 0 && (
        <>
          <div style={{ width: isMobile ? '100%' : '90%', maxWidth: 500 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              📋 Bills (Buckets Filling)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allocation.bills.map((bill, idx) => {
                const fillPercent =
                  bill.required > 0 ? (bill.allocated / bill.required) * 100 : 100;
                return (
                  <div
                    key={idx}
                    style={{
                      background: colors.cardBg,
                      border: `2px solid ${
                        bill.allocated >= bill.required ? colors.success : colors.border
                      }`,
                      borderRadius: 14,
                      padding: isMobile ? '12px 14px' : '14px 18px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Water fill level */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${fillPercent}%`,
                        background:
                          bill.allocated >= bill.required
                            ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.3) 100%)'
                            : 'linear-gradient(180deg, rgba(168, 237, 234, 0.4) 0%, rgba(16, 185, 129, 0.3) 100%)',
                        transition: 'height 0.5s ease',
                        zIndex: 0,
                      }}
                    />
                    <div
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: isMobile ? 14 : 15,
                            fontWeight: 600,
                            color: colors.textPrimary,
                          }}
                        >
                          {bill.name}
                        </span>
                        {bill.isUrgent && bill.daysUntilDue !== undefined && (
                          <span
                            style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            📌 {bill.daysUntilDue}d
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: isMobile ? 16 : 18,
                            fontWeight: 700,
                            color:
                              bill.allocated >= bill.required ? colors.success : colors.warning,
                          }}
                        >
                          {formatCurrency(bill.allocated)}
                        </span>
                        {bill.allocated >= bill.required && <span style={{ fontSize: 16 }}>✓</span>}
                      </div>
                    </div>
                    {bill.allocated < bill.required && (
                      <div
                        style={{
                          position: 'relative',
                          zIndex: 1,
                          fontSize: 11,
                          color: colors.textMuted,
                          marginTop: 6,
                        }}
                      >
                        Goal {formatCurrency(bill.required)} • Next time:{' '}
                        {formatCurrency(bill.remaining)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <FlowConnector />
        </>
      )}

      {/* GOALS LEVEL */}
      {allocation.goals.length > 0 && (
        <>
          <div style={{ width: isMobile ? '100%' : '90%', maxWidth: 500 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              🎯 Goals (Buckets Filling)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allocation.goals.map((goal, idx) => {
                const fillPercent = goal.desired > 0 ? (goal.allocated / goal.desired) * 100 : 100;
                return (
                  <div
                    key={idx}
                    style={{
                      background: colors.cardBg,
                      border: `2px solid ${
                        goal.allocated >= goal.desired ? colors.success : colors.border
                      }`,
                      borderRadius: 14,
                      padding: isMobile ? '12px 14px' : '14px 18px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Water fill level */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${Math.min(fillPercent, 100)}%`,
                        background:
                          goal.allocated >= goal.desired
                            ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.3) 100%)'
                            : 'linear-gradient(180deg, rgba(253, 203, 110, 0.4) 0%, rgba(252, 211, 77, 0.3) 100%)',
                        transition: 'height 0.5s ease',
                        zIndex: 0,
                      }}
                    />
                    <div
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: isMobile ? 14 : 15,
                            fontWeight: 600,
                            color: colors.textPrimary,
                          }}
                        >
                          {goal.name}
                        </span>
                        <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 6 }}>
                          ({goal.type === 'percent' ? `${goal.value}%` : 'fixed'})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: isMobile ? 16 : 18,
                            fontWeight: 700,
                            color: goal.allocated >= goal.desired ? colors.success : colors.warning,
                          }}
                        >
                          {formatCurrency(goal.allocated)}
                        </span>
                        {goal.allocated >= goal.desired && <span style={{ fontSize: 16 }}>✓</span>}
                      </div>
                    </div>
                    {goal.allocated < goal.desired && (
                      <div
                        style={{
                          position: 'relative',
                          zIndex: 1,
                          fontSize: 11,
                          color: colors.textMuted,
                          marginTop: 6,
                        }}
                      >
                        Target {formatCurrency(goal.desired)} • Next time:{' '}
                        {formatCurrency(goal.desired - goal.allocated)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <FlowConnector />
        </>
      )}

      {/* FINAL POOL: Guilt-Free Spending */}
      <div
        style={{
          background: colors.successGradient,
          borderRadius: 24,
          padding: isMobile ? '32px 24px' : '40px 48px',
          boxShadow: '0 16px 48px rgba(16, 185, 129, 0.5)',
          border: '3px solid rgba(255,255,255,0.3)',
          textAlign: 'center',
          width: isMobile ? '100%' : '92%',
          maxWidth: 520,
          marginTop: 8,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.95)',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            marginBottom: 12,
          }}
        >
          💚 The Pool (Guilt-Free)
        </div>
        <div
          style={{
            fontSize: isMobile ? 48 : 64,
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1,
            textShadow: '0 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          {formatCurrency(allocation.guilt_free)}
        </div>
        <div
          style={{
            fontSize: isMobile ? 13 : 15,
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 600,
            marginTop: 16,
            fontStyle: 'italic',
          }}
        >
          Spend it without worry! ✨
        </div>
      </div>

      {/* Settings Info (collapsed at bottom) */}
      <div
        style={{
          width: isMobile ? '100%' : '95%',
          maxWidth: 600,
          marginTop: 32,
          padding: isMobile ? '16px' : '20px',
          background: colors.surfaceBg,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 12,
          }}
        >
          ⚙️ Calculation Settings
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 12,
            fontSize: 13,
            color: colors.textPrimary,
          }}
        >
          <div>
            <span style={{ color: colors.textMuted }}>Pay Frequency:</span>{' '}
            <strong>{settings.payFrequency?.replace('_', ' ')}</strong>
          </div>
          <div>
            <span style={{ color: colors.textMuted }}>Paycheck Range:</span>{' '}
            <strong>
              {formatCurrency(settings.paycheckRange.min)} -{' '}
              {formatCurrency(settings.paycheckRange.max)}
            </strong>
          </div>
          {allocation.meta.supplemental_income > 0 && (
            <div>
              <span style={{ color: colors.textMuted }}>Bonuses:</span>{' '}
              <strong>+{formatCurrency(allocation.meta.supplemental_income)}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
