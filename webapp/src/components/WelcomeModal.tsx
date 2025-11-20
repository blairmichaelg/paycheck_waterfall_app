import React, { useEffect } from 'react';
import { getThemeColors, type Theme } from '../lib/theme';

export type WelcomeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onGoToSettings: () => void;
};

export default function WelcomeModal({
  isOpen,
  onClose,
  theme,
  onGoToSettings,
}: WelcomeModalProps) {
  const colors = getThemeColors(theme);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 20,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        style={{
          background: colors.cardBg,
          borderRadius: 24,
          padding: 40,
          maxWidth: 580,
          width: '100%',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5)',
          animation: 'welcomeSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2
            id="welcome-title"
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 800,
              background: colors.primaryGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 12,
            }}
          >
            Welcome to PayFlow!
          </h2>
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: 16, lineHeight: 1.6 }}>
            Your guilt-free spending companion
          </p>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: colors.primaryGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  Add Your Bills
                </div>
                <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.5 }}>
                  Enter your recurring bills with amounts and due dates
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#fff',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  Set Goals (Optional)
                </div>
                <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.5 }}>
                  Add savings goals as percentages or fixed amounts
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#fff',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  Enter Your Paycheck
                </div>
                <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.5 }}>
                  See instantly how much you can spend guilt-free!
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: colors.surfaceBg,
            padding: 16,
            borderRadius: 12,
            marginBottom: 24,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6 }}>
            <strong style={{ color: colors.textPrimary }}>🔒 Privacy First:</strong> All your data
            stays in your browser. Nothing is sent to any server. Ever.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: `2px solid ${colors.border}`,
              background: 'transparent',
              color: colors.textPrimary,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: 48,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.surfaceBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Explore on My Own
          </button>
          <button
            onClick={() => {
              onGoToSettings();
              onClose();
            }}
            style={{
              padding: '12px 32px',
              borderRadius: 12,
              border: 'none',
              background: colors.successGradient,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
              minHeight: 48,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
            }}
          >
            Let&apos;s Get Started! →
          </button>
        </div>

        <style>{`
          @keyframes welcomeSlideIn {
            from {
              opacity: 0;
              transform: translateY(-30px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
