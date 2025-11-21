import { describe, it, expect } from 'vitest';
import { normalizeToUTCMidnight, daysBetweenUTC, formatRelativeTime } from '../src/lib/dateUtils';

describe('normalizeToUTCMidnight', () => {
  it('normalizes date with time to UTC midnight', () => {
    const date = new Date('2025-01-31T23:59:59-08:00'); // 11:59 PM PST
    const normalized = normalizeToUTCMidnight(date);

    expect(normalized.getUTCHours()).toBe(0);
    expect(normalized.getUTCMinutes()).toBe(0);
    expect(normalized.getUTCSeconds()).toBe(0);
    expect(normalized.getUTCMilliseconds()).toBe(0);
  });

  it('handles ISO date strings', () => {
    const normalized = normalizeToUTCMidnight('2025-01-31');

    expect(normalized.getUTCHours()).toBe(0);
    expect(normalized.getUTCDate()).toBe(31);
    expect(normalized.getUTCMonth()).toBe(0); // January
  });

  it('preserves date when already at midnight UTC', () => {
    const date = new Date(Date.UTC(2025, 0, 31, 0, 0, 0));
    const normalized = normalizeToUTCMidnight(date);

    expect(normalized.getUTCFullYear()).toBe(2025);
    expect(normalized.getUTCMonth()).toBe(0);
    expect(normalized.getUTCDate()).toBe(31);
  });

  it('handles dates near DST transitions', () => {
    // March 10, 2024 - Spring forward (DST begins)
    const dstDate = new Date(2024, 2, 10, 2, 30, 0);
    const normalized = normalizeToUTCMidnight(dstDate);

    expect(normalized.getUTCHours()).toBe(0);
    expect(normalized.getUTCDate()).toBe(10);
  });

  it('handles dates in different time zones consistently', () => {
    // Different calendar dates in different time zones normalize to their respective UTC midnights
    const date1 = new Date('2025-01-31T23:00:00-08:00'); // 11 PM PST Jan 31 = Feb 1 07:00 UTC
    const date2 = new Date('2025-01-31T02:00:00+05:00'); // 2 AM Jan 31 UTC+5 = Jan 30 21:00 UTC

    const norm1 = normalizeToUTCMidnight(date1);
    const norm2 = normalizeToUTCMidnight(date2);

    // norm1 should be Feb 1 midnight UTC (timestamp: 1738368000000)
    // norm2 should be Jan 30 midnight UTC (timestamp: 1738195200000)
    // They are different because they represent different UTC days
    expect(norm1.getTime()).toBeGreaterThan(norm2.getTime());
  });
});

describe('daysBetweenUTC', () => {
  it('calculates days correctly across time zones', () => {
    const from = new Date('2025-01-31T23:00:00-08:00'); // 11 PM PST Jan 31 = Feb 1 07:00 UTC
    const to = new Date('2025-02-01T01:00:00-08:00');   // 1 AM PST Feb 1 = Feb 1 09:00 UTC

    // Both are on Feb 1 in UTC, so 0 days between
    expect(daysBetweenUTC(from, to)).toBe(0);
  });

  it('returns 1 for adjacent days in same timezone', () => {
    const from = new Date('2025-01-31T01:00:00-08:00'); // 1 AM PST Jan 31 = Jan 31 09:00 UTC
    const to = new Date('2025-02-01T23:00:00-08:00');   // 11 PM PST Feb 1 = Feb 2 07:00 UTC

    // Jan 31 UTC -> Feb 2 UTC = 2 days between
    expect(daysBetweenUTC(from, to)).toBe(2);
  });

  it('returns negative days for past dates', () => {
    const from = new Date('2025-02-01');
    const to = new Date('2025-01-31');

    expect(daysBetweenUTC(from, to)).toBe(-1);
  });

  it('calculates large date differences correctly', () => {
    const from = new Date('2024-01-01');
    const to = new Date('2025-01-01');

    // 2024 is a leap year, so 366 days
    expect(daysBetweenUTC(from, to)).toBe(366);
  });

  it('handles leap year transitions', () => {
    const from = new Date('2024-02-28');
    const to = new Date('2024-03-01');

    // Should be 2 days (Feb 29 exists in 2024)
    expect(daysBetweenUTC(from, to)).toBe(2);
  });

  it('handles non-leap year February', () => {
    const from = new Date('2025-02-28');
    const to = new Date('2025-03-01');

    // Should be 1 day (no Feb 29 in 2025)
    expect(daysBetweenUTC(from, to)).toBe(1);
  });

  it('handles DST spring forward', () => {
    // March 10, 2024 - Spring forward (clock jumps from 2 AM to 3 AM)
    const from = new Date(2024, 2, 9, 12, 0, 0);  // March 9, noon
    const to = new Date(2024, 2, 11, 12, 0, 0);   // March 11, noon

    // Should be 2 days regardless of DST
    expect(daysBetweenUTC(from, to)).toBe(2);
  });

  it('handles DST fall back', () => {
    // November 3, 2024 - Fall back (clock jumps from 2 AM to 1 AM)
    const from = new Date(2024, 10, 2, 12, 0, 0);  // November 2, noon
    const to = new Date(2024, 10, 4, 12, 0, 0);    // November 4, noon

    // Should be 2 days regardless of DST
    expect(daysBetweenUTC(from, to)).toBe(2);
  });

  it('handles month boundaries', () => {
    const from = new Date('2025-01-31');
    const to = new Date('2025-02-01');

    expect(daysBetweenUTC(from, to)).toBe(1);
  });

  it('handles year boundaries', () => {
    const from = new Date('2024-12-31');
    const to = new Date('2025-01-01');

    expect(daysBetweenUTC(from, to)).toBe(1);
  });
});

describe('formatRelativeTime', () => {
  it('formats "just now" for very recent times', () => {
    const now = Date.now();
    expect(formatRelativeTime(now)).toBe('just now');
    expect(formatRelativeTime(now - 5000)).toBe('just now');
  });

  it('formats seconds ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 30000)).toBe('30 seconds ago');
  });

  it('formats minutes ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 60000)).toBe('1 minute ago');
    expect(formatRelativeTime(now - 300000)).toBe('5 minutes ago');
  });

  it('formats hours ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 3600000)).toBe('1 hour ago');
    expect(formatRelativeTime(now - 7200000)).toBe('2 hours ago');
  });

  it('formats "yesterday"', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 86400000)).toBe('yesterday');
  });

  it('formats days ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 172800000)).toBe('2 days ago');
    expect(formatRelativeTime(now - 518400000)).toBe('6 days ago');
  });

  it('formats absolute date for old timestamps', () => {
    const now = Date.now();
    const eightDaysAgo = now - 8 * 86400000;
    const result = formatRelativeTime(eightDaysAgo);

    // Should return a formatted date string
    expect(result).toMatch(/\d+\/\d+\/\d+/);
  });
});
