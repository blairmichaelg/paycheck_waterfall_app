import React, { useEffect, useState } from 'react';

export type ToastProps = {
  message: string;
  onDismiss: () => void;
  duration?: number;
  variant?: 'success' | 'error' | 'warning' | 'info';
};

export default function Toast({
  message,
  onDismiss,
  duration = 3000,
  variant = 'success',
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setVisible(true), 10);

    // Auto-dismiss
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);

    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  const styles = {
    success: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadow: 'rgba(16, 185, 129, 0.4)',
      icon: '✓',
    },
    error: {
      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      shadow: 'rgba(220, 38, 38, 0.4)',
      icon: '✕',
    },
    warning: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      shadow: 'rgba(245, 158, 11, 0.4)',
      icon: '⚠',
    },
    info: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadow: 'rgba(59, 130, 246, 0.4)',
      icon: 'ℹ',
    },
  };

  const style = styles[variant];

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: style.background,
        color: '#fff',
        padding: '16px 24px',
        borderRadius: 12,
        boxShadow: `0 8px 24px ${style.shadow}`,
        zIndex: 10000,
        fontWeight: 600,
        fontSize: 15,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s ease',
        maxWidth: '90vw',
        wordBreak: 'break-word',
      }}
    >
      {style.icon} {message}
    </div>
  );
}
