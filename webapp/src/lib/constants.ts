/**
 * Shared design constants for consistent styling across the app.
 * Centralizes spacing, sizing, and layout values to maintain design system coherence.
 */

/**
 * Spacing scale based on 4px base unit.
 * Use these values for padding, margin, and gaps to maintain consistent rhythm.
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

/**
 * Border radius scale for consistent roundness across components.
 */
export const BORDER_RADIUS = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  '3xl': 20,
  '4xl': 24,
} as const;

/**
 * Font sizes for typography hierarchy.
 */
export const FONT_SIZE = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 15,
  xl: 16,
  '2xl': 18,
  '3xl': 20,
  '4xl': 24,
  '5xl': 32,
  '6xl': 40,
  '7xl': 48,
  '8xl': 64,
} as const;

/**
 * Font weights for text emphasis.
 */
export const FONT_WEIGHT = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

/**
 * Standard box shadows for elevation.
 */
export const BOX_SHADOW = {
  sm: '0 2px 4px rgba(0,0,0,0.06)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  lg: '0 8px 24px rgba(0,0,0,0.12)',
  xl: '0 12px 32px rgba(0,0,0,0.16)',
  '2xl': '0 20px 60px rgba(0,0,0,0.3)',
  // Colored shadows for emphasis
  primary: '0 4px 12px rgba(102, 126, 234, 0.4)',
  success: '0 4px 12px rgba(16, 185, 129, 0.4)',
  warning: '0 4px 12px rgba(245, 158, 11, 0.3)',
  accent: '0 8px 24px rgba(253, 203, 110, 0.3)',
} as const;

/**
 * Transition durations for animations.
 */
export const TRANSITION = {
  fast: '0.15s',
  normal: '0.2s',
  slow: '0.3s',
  slower: '0.4s',
} as const;

/**
 * Z-index layers for stacking context.
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 10000,
  toast: 10100,
} as const;

/**
 * Minimum touch target size for accessibility (WCAG 2.1 AAA).
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Breakpoints for responsive design.
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

/**
 * Common CSS transitions for hover effects.
 */
export const HOVER_TRANSITION = `all ${TRANSITION.normal} ease`;

/**
 * Standard card style object for reuse.
 */
export const CARD_STYLE = {
  borderRadius: BORDER_RADIUS['2xl'],
  boxShadow: BOX_SHADOW.md,
  padding: SPACING['2xl'],
  transition: `all ${TRANSITION.slow} ease`,
} as const;
