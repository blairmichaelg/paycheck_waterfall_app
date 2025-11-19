/**
 * Observability module - currently disabled.
 * These are no-op functions that can be enabled in the future if needed.
 * To enable: add VITE_ENABLE_OBSERVABILITY=true and VITE_ANALYTICS_URL to .env
 */

/**
 * Track a user action (no-op stub).
 */
export function trackAction(
  _action: string,
  _details?: Record<string, string | number | boolean>
): void {
  // No-op: Observability disabled
  // To enable: implement analytics endpoint integration
}

/**
 * Track an event (no-op stub).
 */
export function trackEvent(
  _event: string,
  _properties?: Record<string, string | number | boolean>
): void {
  // No-op: Observability disabled
}

/**
 * Track an error (no-op stub).
 */
export function trackError(_error: Error, _context?: Record<string, unknown>): void {
  // No-op: Observability disabled
}
