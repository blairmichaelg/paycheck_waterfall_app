/**
 * Shared formatting utilities for currency, dates, and other display values.
 * Centralizes formatting logic to ensure consistency across the app.
 */

/**
 * Format a number as USD currency.
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

/**
 * Format a number as a percentage.
 * @param value - The numeric value (e.g., 10 for 10%)
 * @param decimals - Number of decimal places to show
 * @returns Formatted percentage string (e.g., "10%")
 */
export const formatPercent = (value: number, decimals: number = 0): string =>
  new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: decimals,
  }).format(value / 100);

/**
 * Format a date as a localized string.
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
};

/**
 * Format a date as a short string without year.
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "Jan 15")
 */
export const formatDateShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
};

/**
 * Format a timestamp as relative time (e.g., "3 hours ago").
 * Uses friendly, positive language aligned with app philosophy.
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted relative time string
 */
export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
};

/**
 * Format bill/bonus cadence for display.
 * @param cadence - The cadence value
 * @returns User-friendly cadence label
 */
export const formatCadence = (cadence: string): string => {
  const labels: Record<string, string> = {
    one_time: 'One-time',
    every_paycheck: 'Every paycheck',
    weekly: 'Weekly',
    biweekly: 'Biweekly',
    semi_monthly: 'Semi-monthly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
  };
  return labels[cadence] || cadence.replace('_', ' ');
};
