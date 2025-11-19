import React, { useEffect } from 'react';
import { getThemeColors, type Theme } from '../lib/theme';

export type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  theme: Theme;
  variant?: 'danger' | 'warning' | 'info';
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  theme,
  variant = 'warning',
}: ConfirmModalProps) {
  const colors = getThemeColors(theme);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

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

  const variantColors = {
    danger: {
      bg: colors.errorBg,
      text: colors.error,
      buttonBg: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    },
    warning: {
      bg: colors.warningBg,
      text: colors.warning,
      buttonBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
    info: {
      bg: colors.surfaceBg,
      text: colors.textPrimary,
      buttonBg: colors.primaryGradient,
    },
  };

  const style = variantColors[variant];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        style={{
          background: colors.cardBg,
          borderRadius: 20,
          padding: 32,
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          animation: 'slideIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: style.bg,
            padding: '12px 16px',
            borderRadius: 12,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>
            {variant === 'danger' ? '⚠️' : variant === 'warning' ? '🚨' : 'ℹ️'}
          </span>
          <h3
            id="modal-title"
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: style.text,
            }}
          >
            {title}
          </h3>
        </div>

        <p
          style={{ margin: '0 0 24px 0', color: colors.textPrimary, fontSize: 15, lineHeight: 1.6 }}
        >
          {message}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              border: `2px solid ${colors.border}`,
              background: 'transparent',
              color: colors.textPrimary,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: 44,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.surfaceBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            autoFocus
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              border: 'none',
              background: style.buttonBg,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              minHeight: 44,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
