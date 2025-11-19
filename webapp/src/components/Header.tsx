import React from 'react';
import { getThemeColors, type Theme } from '../lib/theme';
import type { AllocationResult } from '../lib/allocations';

type HeaderProps = {
  lastAllocation?: AllocationResult | null;
  theme: Theme;
  onToggleTheme: () => void;
};

export default function Header({ lastAllocation, theme, onToggleTheme }: HeaderProps) {
  const guiltFree = lastAllocation ? lastAllocation.guilt_free : 0;
  const hasAllocation = lastAllocation !== null;
  const colors = getThemeColors(theme);

  return (
    <header style={{ marginBottom: 24, textAlign: 'center', position: 'relative' }}>
      <button
        onClick={onToggleTheme}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          padding: '8px 16px',
          background: colors.surfaceBg,
          border: `1px solid ${colors.border}`,
          borderRadius: 20,
          cursor: 'pointer',
          fontSize: 20,
          transition: 'all 0.2s ease',
        }}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <h1
        style={{
          margin: 0,
          fontSize: 36,
          fontWeight: 700,
          background: colors.primaryGradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 8,
        }}
      >
        PayFlow
      </h1>
      <p style={{ margin: 0, color: colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
        Your guilt-free spending companion
      </p>

      {hasAllocation && (
        <div
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '16px 32px',
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            💚 Guilt-Free Spending
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginTop: 4 }}>
            ${guiltFree.toFixed(2)}
          </div>
        </div>
      )}
    </header>
  );
}
