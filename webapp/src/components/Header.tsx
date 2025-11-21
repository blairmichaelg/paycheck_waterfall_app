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
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

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
            padding: isMobile ? '24px 20px' : '64px 80px',
            borderRadius: 28,
            boxShadow: '0 20px 60px rgba(16, 185, 129, 0.5)',
            marginTop: isMobile ? 16 : 32,
            marginBottom: 16,
            minWidth: isMobile ? '95%' : '90%',
            maxWidth: '800px',
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 16 : 22,
              color: 'rgba(255,255,255,0.95)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: isMobile ? 8 : 16,
            }}
          >
            Your Guilt-Free Spending
          </div>
          <div
            style={{
              fontSize: isMobile ? 48 : 72,
              fontWeight: 900,
              color: '#fff',
              marginTop: isMobile ? 4 : 12,
              lineHeight: 0.95,
              textShadow: '0 6px 16px rgba(0,0,0,0.25)',
            }}
          >
            ${guiltFree.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: isMobile ? 13 : 16,
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 600,
              marginTop: isMobile ? 12 : 20,
              fontStyle: 'italic',
            }}
          >
            Spend it without worry - bills and goals covered!
          </div>
        </div>
      )}
    </header>
  );
}
