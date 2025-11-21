/**
 * Normalize a date to UTC midnight.
 * Prevents time zone issues when comparing dates.
 *
 * @param date - Date to normalize (Date object or ISO string)
 * @returns New Date object set to midnight UTC
 * @example
 * const date = new Date('2025-01-31T23:00:00-08:00'); // 11 PM PST
 * const normalized = normalizeToUTCMidnight(date);
 * // normalized = 2025-02-01T00:00:00Z (next day in UTC)
 */
export function normalizeToUTCMidnight(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Use UTC date components to avoid local timezone shifts
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Calculate days between two dates in UTC midnight terms.
 * Prevents off-by-one errors due to time zones.
 *
 * @param fromDate - Start date
 * @param toDate - End date
 * @returns Number of full days between dates
 * @example
 * const from = new Date('2025-01-31T23:00:00-08:00'); // 11 PM PST
 * const to = new Date('2025-02-01T01:00:00-08:00');   // 1 AM PST next day
 * daysBetweenUTC(from, to) // Returns 1
 */
export function daysBetweenUTC(fromDate: Date, toDate: Date): number {
  const from = normalizeToUTCMidnight(fromDate);
  const to = normalizeToUTCMidnight(toDate);
  const diffMs = to.getTime() - from.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a timestamp as relative time (e.g., "2 minutes ago", "just now")
 * Falls back to absolute date if more than 7 days ago
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHour === 1) return '1 hour ago';
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;

  // More than 7 days - show absolute date
  return new Date(timestamp).toLocaleDateString();
}
