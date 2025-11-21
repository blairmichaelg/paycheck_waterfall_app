/**
 * Design constants for consistent styling across the app.
 */

/**
 * Minimum touch target size for accessibility (WCAG 2.1 AAA).
 * All interactive elements should be at least 44x44px.
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Breakpoints for responsive design.
 * Used by useIsMobile() hook and responsive components.
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;
