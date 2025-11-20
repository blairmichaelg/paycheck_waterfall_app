import React, { useEffect, useId, useState } from 'react';
import { getThemeColors, type Theme } from '../lib/theme';
import ConfirmModal from './ConfirmModal';
import { formatRelativeTime } from '../lib/dateUtils';
import {
  BILL_CADENCES,
  PAY_FREQUENCIES,
  CONFIG_VERSION,
  type UserConfig,
  type Bill,
  type Goal,
  type BonusIncome,
} from '../lib/types';

type OnboardingProps = {
  initial: UserConfig;
  onSave: (c: UserConfig) => void;
  lastSavedAt?: number;
  theme: Theme;
};

export default function Onboarding({ initial, onSave, lastSavedAt, theme }: OnboardingProps) {
  const colors = getThemeColors(theme);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [bills, setBills] = useState<Bill[]>(() => initial.bills.map((b) => ({ ...b })));
  const [goals, setGoals] = useState<Goal[]>(() => initial.goals.map((g) => ({ ...g })));
  const [percentApply, setPercentApply] = useState<UserConfig['settings']['percentApply']>(
    initial.settings.percentApply
  );
  const [payFrequency, setPayFrequency] = useState<UserConfig['settings']['payFrequency']>(
    initial.settings.payFrequency
  );
  const [paycheckMin, setPaycheckMin] = useState(initial.settings.paycheckRange.min);
  const [paycheckMax, setPaycheckMax] = useState(initial.settings.paycheckRange.max);
  const [bonuses, setBonuses] = useState<BonusIncome[]>(() =>
    initial.bonuses.map((b) => ({ ...b }))
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'bill' | 'goal' | 'bonus' | null;
    index: number | null;
  }>({ isOpen: false, type: null, index: null });
  const percentApplyFieldId = useId();
  const bonusId = useId();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextBillTemplate: Bill = {
    name: '',
    amount: 0,
    cadence: 'monthly',
    dueDay: 1,
  };

  const nextBonusTemplate: BonusIncome = {
    name: '',
    cadence: 'monthly',
    range: { min: 0, max: 0 },
    recurring: true,
  };

  useEffect(() => {
    setBills(initial.bills.map((b) => ({ ...nextBillTemplate, ...b })));
    setGoals(initial.goals.map((g) => ({ ...g })));
    setPercentApply(initial.settings.percentApply);
    setPayFrequency(initial.settings.payFrequency);
    setPaycheckMin(initial.settings.paycheckRange.min);
    setPaycheckMax(initial.settings.paycheckRange.max);
    setBonuses(initial.bonuses.map((b) => ({ ...nextBonusTemplate, ...b })));
  }, [initial]);

  const addBill = () => setBills([...bills, { ...nextBillTemplate }]);
  const addGoal = () => setGoals([...goals, { name: '', type: 'percent', value: 0 }]);
  const addBonus = () => setBonuses([...bonuses, { ...nextBonusTemplate }]);

  const removeBill = (i: number) => {
    setConfirmModal({ isOpen: true, type: 'bill', index: i });
  };

  const removeGoal = (i: number) => {
    setConfirmModal({ isOpen: true, type: 'goal', index: i });
  };

  const removeBonus = (i: number) => {
    setConfirmModal({ isOpen: true, type: 'bonus', index: i });
  };

  const save = () => {
    // basic validation
    for (const b of bills) {
      if (!b.name || b.name.trim() === '') {
        setError('All bills must have a name');
        return;
      }
      if (Number.isNaN(Number(b.amount)) || b.amount < 0) {
        setError('Bill amounts must be non-negative numbers');
        return;
      }
      if (b.dueDay !== undefined && (b.dueDay < 1 || b.dueDay > 31)) {
        setError('Bill due day must be between 1 and 31');
        return;
      }
    }
    for (const g of goals) {
      if (!g.name || g.name.trim() === '') {
        setError('All goals must have a name');
        return;
      }
      if (Number.isNaN(Number(g.value)) || g.value < 0) {
        setError('Goal values must be non-negative numbers');
        return;
      }
    }
    for (const bonus of bonuses) {
      if (!bonus.name || bonus.name.trim() === '') {
        setError('All bonuses must have a name');
        return;
      }
      if (Number.isNaN(Number(bonus.range.min)) || Number.isNaN(Number(bonus.range.max))) {
        setError('Bonus ranges must be valid numbers');
        return;
      }
      if (bonus.range.max < bonus.range.min) {
        setError('Bonus range max must be ≥ min');
        return;
      }
    }
    if (paycheckMax < paycheckMin) {
      setError('Paycheck range max must be ≥ min');
      return;
    }
    setError(null);
    const next: UserConfig = {
      ...initial,
      version: CONFIG_VERSION,
      updatedAt: new Date().toISOString(),
      bills: bills.map((b) => ({
        ...nextBillTemplate,
        ...b,
        amount: Number(b.amount) || 0,
        dueDay: b.dueDay ? Math.min(31, Math.max(1, Number(b.dueDay))) : undefined,
      })),
      goals: goals.map((g) => ({ ...g, value: Number(g.value) || 0 })),
      bonuses: bonuses.map((bonus) => ({
        ...nextBonusTemplate,
        ...bonus,
        range: {
          min: Math.max(0, Number(bonus.range.min) || 0),
          max: Math.max(0, Number(bonus.range.max) || 0),
        },
      })),
      settings: {
        percentApply,
        payFrequency,
        paycheckRange: {
          min: Math.max(0, Number(paycheckMin) || 0),
          max: Math.max(0, Number(paycheckMax) || 0),
        },
      },
    };
    onSave(next);
  };

  return (
    <div
      style={{
        background: colors.cardBg,
        padding: isMobile ? 16 : 24,
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        border: `1px solid ${colors.border}`,
        transition: 'all 0.3s ease',
      }}
    >
      <h3
        style={{
          margin: '0 0 20px 0',
          fontSize: isMobile ? 20 : 24,
          fontWeight: 700,
          color: colors.textPrimary,
        }}
      >
        ⚙️ Configuration
      </h3>
      {error ? (
        <div
          style={{
            color: colors.error,
            marginBottom: 16,
            padding: 12,
            background: colors.errorBg,
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.3s ease',
          }}
        >
          {error}
        </div>
      ) : null}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '12px 16px',
            borderRadius: 12,
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          }}
        >
          <h4
            style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.3px' }}
          >
            📋 Bills
          </h4>
        </div>
        {bills.map((b, i) => (
          <div
            key={i}
            style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="name"
                value={b.name}
                onChange={(e) => {
                  const next = [...bills];
                  next[i].name = e.target.value;
                  setBills(next);
                }}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                step="0.01"
                placeholder="amount"
                value={b.amount ?? ''}
                onChange={(e) => {
                  const next = [...bills];
                  next[i].amount = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setBills(next);
                }}
                style={{ width: 120 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>
                  Frequency
                </span>
                <select
                  value={b.cadence}
                  onChange={(e) => {
                    const next = [...bills];
                    next[i].cadence = e.target.value as Bill['cadence'];
                    setBills(next);
                  }}
                >
                  {BILL_CADENCES.map((cadence) => (
                    <option key={cadence} value={cadence}>
                      {cadence.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              {b.cadence === 'monthly' && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>
                    Due day (1-31)
                  </span>
                  <input
                    type="number"
                    placeholder="day"
                    value={b.dueDay ?? ''}
                    min={1}
                    max={31}
                    onChange={(e) => {
                      const next = [...bills];
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      next[i].dueDay = value;
                      setBills(next);
                    }}
                    style={{ width: 80 }}
                  />
                </label>
              )}
              <button
                onClick={() => removeBill(i)}
                aria-label={`remove-bill-${i}`}
                style={{ alignSelf: 'flex-end', minHeight: '44px' }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addBill}
          style={{
            padding: '8px 16px',
            background: colors.surfaceBg,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            color: colors.textPrimary,
            minHeight: '44px',
            transition: 'background 0.2s ease',
          }}
        >
          + Add bill
        </button>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '12px 16px',
            borderRadius: 12,
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          }}
        >
          <h4
            style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.3px' }}
          >
            🎯 Goals
          </h4>
        </div>
        {goals.map((g, i) => (
          <div
            key={i}
            style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="name"
                value={g.name}
                onChange={(e) => {
                  const next = [...goals];
                  next[i].name = e.target.value;
                  setGoals(next);
                }}
                style={{ flex: 1, minWidth: 150 }}
              />
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>Type</span>
                <select
                  value={g.type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const next = [...goals];
                    next[i].type = e.target.value as Goal['type'];
                    setGoals(next);
                  }}
                >
                  <option value="percent">percent</option>
                  <option value="fixed">fixed</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>
                  Value
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="value"
                  value={g.value ?? ''}
                  onChange={(e) => {
                    const next = [...goals];
                    next[i].value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setGoals(next);
                  }}
                  style={{ width: 100 }}
                />
              </label>
              <button
                onClick={() => removeGoal(i)}
                aria-label={`remove-goal-${i}`}
                style={{ alignSelf: 'flex-end', minHeight: '44px' }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addGoal}
          style={{
            padding: '8px 16px',
            background: colors.surfaceBg,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            color: colors.textPrimary,
            minHeight: '44px',
            transition: 'background 0.2s ease',
          }}
        >
          + Add goal
        </button>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            padding: '12px 16px',
            borderRadius: 12,
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}
        >
          <h4
            style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.3px' }}
          >
            ⚙️ Settings
          </h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label
            htmlFor={percentApplyFieldId}
            style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>
              Percent goals apply to
            </span>
            <select
              id={percentApplyFieldId}
              value={percentApply}
              onChange={(e) =>
                setPercentApply(e.target.value as UserConfig['settings']['percentApply'])
              }
            >
              <option value="gross">Gross (whole paycheck)</option>
              <option value="remainder">Remainder after bills</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>
              Pay frequency
            </span>
            <select
              value={payFrequency}
              onChange={(e) =>
                setPayFrequency(e.target.value as UserConfig['settings']['payFrequency'])
              }
            >
              {PAY_FREQUENCIES.map((freq) => (
                <option key={freq} value={freq}>
                  {freq.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <div
            style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>
                Paycheck range - Min amount
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 800"
                value={paycheckMin || ''}
                onChange={(e) =>
                  setPaycheckMin(e.target.value === '' ? 0 : parseFloat(e.target.value))
                }
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>
                Paycheck range - Max amount
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 1200"
                value={paycheckMax || ''}
                onChange={(e) =>
                  setPaycheckMax(e.target.value === '' ? 0 : parseFloat(e.target.value))
                }
              />
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            padding: '12px 16px',
            borderRadius: 12,
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
          }}
        >
          <h4
            style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.3px' }}
          >
            💰 Bonus / Supplemental Income
          </h4>
        </div>
        {bonuses.length === 0 ? (
          <div style={{ color: colors.textMuted }}>No bonuses configured.</div>
        ) : null}
        {bonuses.map((bonus, i) => (
          <div
            key={`${bonusId}-${i}`}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="name"
                value={bonus.name}
                onChange={(e) => {
                  const next = [...bonuses];
                  next[i].name = e.target.value;
                  setBonuses(next);
                }}
                style={{ flex: 1, minWidth: 150 }}
              />
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>
                  Frequency
                </span>
                <select
                  value={bonus.cadence}
                  onChange={(e) => {
                    const next = [...bonuses];
                    next[i].cadence = e.target.value as BonusIncome['cadence'];
                    setBonuses(next);
                  }}
                >
                  {BILL_CADENCES.map((cadence) => (
                    <option key={cadence} value={cadence}>
                      {cadence.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>
                  Min amount
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="min"
                  value={bonus.range.min || ''}
                  onChange={(e) => {
                    const next = [...bonuses];
                    next[i].range.min = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setBonuses(next);
                  }}
                  style={{ width: 100 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>
                  Max amount
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="max"
                  value={bonus.range.max || ''}
                  onChange={(e) => {
                    const next = [...bonuses];
                    next[i].range.max = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setBonuses(next);
                  }}
                  style={{ width: 100 }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="checkbox"
                  checked={bonus.recurring}
                  onChange={(e) => {
                    const next = [...bonuses];
                    next[i].recurring = e.target.checked;
                    setBonuses(next);
                  }}
                />
                Recurring
              </label>
              <button onClick={() => removeBonus(i)}>Remove</button>
            </div>
          </div>
        ))}
        <button
          onClick={addBonus}
          style={{
            padding: '8px 16px',
            background: colors.surfaceBg,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            color: colors.textPrimary,
            minHeight: '44px',
            transition: 'background 0.2s ease',
          }}
        >
          + Add bonus
        </button>
      </div>

      <div style={{ marginTop: 24, paddingTop: 24, borderTop: `2px solid ${colors.border}` }}>
        <button
          onClick={save}
          style={{
            padding: '14px 28px',
            background: colors.successGradient,
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
            minHeight: '44px',
            minWidth: '200px',
          }}
        >
          💾 Save Configuration
        </button>
        {lastSavedAt ? (
          <div style={{ marginTop: 4, fontSize: 12, color: colors.textMuted }}>
            Last saved {formatRelativeTime(lastSavedAt)}
          </div>
        ) : null}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={`Remove ${confirmModal.type || 'item'}?`}
        message={`Are you sure you want to remove this ${confirmModal.type}? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="warning"
        theme={theme}
        onConfirm={() => {
          if (confirmModal.type === 'bill' && confirmModal.index !== null) {
            setBills(bills.filter((_, idx) => idx !== confirmModal.index));
          } else if (confirmModal.type === 'goal' && confirmModal.index !== null) {
            setGoals(goals.filter((_, idx) => idx !== confirmModal.index));
          } else if (confirmModal.type === 'bonus' && confirmModal.index !== null) {
            setBonuses(bonuses.filter((_, idx) => idx !== confirmModal.index));
          }
          setConfirmModal({ isOpen: false, type: null, index: null });
        }}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, index: null })}
      />
    </div>
  );
}
