import React, { CSSProperties, ReactNode } from 'react';
import { getThemeColors, type Theme } from '../lib/theme';
import { SPACING, BORDER_RADIUS, BOX_SHADOW, TRANSITION } from '../lib/constants';

export type CardVariant = 'default' | 'gradient' | 'success' | 'warning' | 'accent' | 'primary';
export type CardSize = 'sm' | 'md' | 'lg';

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  theme: Theme;
  gradient?: string;
  noPadding?: boolean;
  noBorder?: boolean;
  noShadow?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  className?: string;
};

const VARIANT_STYLES = {
  default: (colors: ReturnType<typeof getThemeColors>) => ({
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
  }),
  gradient: (colors: ReturnType<typeof getThemeColors>) => ({
    background: colors.primaryGradient,
    border: '2px solid rgba(255,255,255,0.3)',
    color: '#fff',
  }),
  success: (colors: ReturnType<typeof getThemeColors>) => ({
    background: colors.successGradient,
    border: '2px solid rgba(255,255,255,0.3)',
    color: '#fff',
  }),
  warning: (colors: ReturnType<typeof getThemeColors>) => ({
    background: colors.warningGradient,
    border: '2px solid rgba(255,255,255,0.3)',
    color: '#fff',
  }),
  accent: (colors: ReturnType<typeof getThemeColors>) => ({
    background: colors.accentGradient,
    border: '2px solid rgba(255,255,255,0.3)',
    color: colors.textPrimary,
  }),
  primary: (colors: ReturnType<typeof getThemeColors>) => ({
    background: colors.primaryGradient,
    border: 'none',
    color: '#fff',
  }),
};

const SIZE_STYLES = {
  sm: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  md: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS['2xl'],
  },
  lg: {
    padding: SPACING['3xl'],
    borderRadius: BORDER_RADIUS['3xl'],
  },
};

/**
 * Reusable Card component with consistent styling and variants.
 * Reduces code duplication and maintains design system coherence.
 *
 * @example
 * ```tsx
 * <Card variant="success" theme={theme}>
 *   <h3>Guilt-Free Spending</h3>
 *   <p>${amount}</p>
 * </Card>
 * ```
 */
export default function Card({
  children,
  variant = 'default',
  size = 'md',
  theme,
  gradient,
  noPadding = false,
  noBorder = false,
  noShadow = false,
  style = {},
  onClick,
  className,
}: CardProps) {
  const colors = getThemeColors(theme);
  const variantStyle = VARIANT_STYLES[variant](colors);
  const sizeStyle = SIZE_STYLES[size];

  const cardStyle: CSSProperties = {
    ...sizeStyle,
    ...variantStyle,
    boxShadow: noShadow ? 'none' : BOX_SHADOW.md,
    transition: `all ${TRANSITION.slow} ease`,
    ...(gradient && { background: gradient }),
    ...(noPadding && { padding: 0 }),
    ...(noBorder && { border: 'none' }),
    ...(onClick && { cursor: 'pointer' }),
    ...style,
  };

  return (
    <div style={cardStyle} onClick={onClick} className={className}>
      {children}
    </div>
  );
}

/**
 * Specialized StatCard for displaying key metrics.
 */
export function StatCard({
  title,
  value,
  icon,
  variant = 'success',
  theme,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon?: string;
  variant?: CardVariant;
  theme: Theme;
  subtitle?: string;
}) {
  const colors = getThemeColors(theme);

  return (
    <Card variant={variant} theme={theme}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: variant === 'default' ? colors.textSecondary : 'rgba(255,255,255,0.85)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: 8,
        }}
      >
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
        {title}
      </div>
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: variant === 'default' ? colors.textPrimary : '#fff',
          lineHeight: 1,
          textShadow: variant !== 'default' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 13,
            color: variant === 'default' ? colors.textMuted : 'rgba(255,255,255,0.9)',
            marginTop: 8,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </div>
      )}
    </Card>
  );
}

/**
 * Empty state card with icon, message, and optional action.
 */
export function EmptyStateCard({
  icon,
  title,
  message,
  action,
  theme,
}: {
  icon: string;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
  theme: Theme;
}) {
  const colors = getThemeColors(theme);

  return (
    <Card theme={theme} variant="default" size="lg">
      <div style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{icon}</div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: 12,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            marginBottom: action ? 24 : 0,
            lineHeight: 1.6,
          }}
        >
          {message}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            style={{
              padding: '12px 24px',
              background: colors.successGradient,
              border: 'none',
              borderRadius: BORDER_RADIUS.lg,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: BOX_SHADOW.success,
              minHeight: 44,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = BOX_SHADOW.success;
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </Card>
  );
}
