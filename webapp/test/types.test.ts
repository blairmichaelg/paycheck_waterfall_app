import { describe, it, expect } from 'vitest';
import { billSchema, settingsSchema, isoDateSchema } from '../src/lib/types';

describe('isoDateSchema', () => {
  it('accepts valid ISO date strings', () => {
    expect(isoDateSchema.safeParse('2025-01-31').success).toBe(true);
    expect(isoDateSchema.safeParse('2024-02-29').success).toBe(true); // Leap year
    expect(isoDateSchema.safeParse('2025-12-31').success).toBe(true);
  });

  it('rejects invalid date formats', () => {
    expect(isoDateSchema.safeParse('12/31/2025').success).toBe(false); // US format
    expect(isoDateSchema.safeParse('31-12-2025').success).toBe(false); // DD-MM-YYYY
    expect(isoDateSchema.safeParse('2025/01/31').success).toBe(false); // Wrong separator
    expect(isoDateSchema.safeParse('2025-1-31').success).toBe(false); // Single digit month
    expect(isoDateSchema.safeParse('2025-01-1').success).toBe(false); // Single digit day
  });

  it('rejects invalid dates', () => {
    expect(isoDateSchema.safeParse('2025-02-30').success).toBe(false); // Feb 30th
    expect(isoDateSchema.safeParse('2025-13-01').success).toBe(false); // Month 13
    expect(isoDateSchema.safeParse('2025-00-01').success).toBe(false); // Month 0
    expect(isoDateSchema.safeParse('2025-01-32').success).toBe(false); // Day 32
    expect(isoDateSchema.safeParse('2023-02-29').success).toBe(false); // Non-leap year
  });

  it('rejects non-date strings', () => {
    expect(isoDateSchema.safeParse('invalid-date').success).toBe(false);
    expect(isoDateSchema.safeParse('').success).toBe(false);
    expect(isoDateSchema.safeParse('abc-def-ghi').success).toBe(false);
  });
});

describe('billSchema with date validation', () => {
  it('accepts bills with valid nextDueDate', () => {
    const result = billSchema.safeParse({
      name: 'Rent',
      amount: 1000,
      cadence: 'monthly',
      nextDueDate: '2025-01-31',
    });
    expect(result.success).toBe(true);
  });

  it('accepts bills without nextDueDate', () => {
    const result = billSchema.safeParse({
      name: 'Rent',
      amount: 1000,
      cadence: 'monthly',
    });
    expect(result.success).toBe(true);
  });

  it('rejects bills with invalid nextDueDate format', () => {
    const result = billSchema.safeParse({
      name: 'Rent',
      amount: 1000,
      cadence: 'monthly',
      nextDueDate: '12/31/2025',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('YYYY-MM-DD');
    }
  });

  it('rejects bills with invalid dates', () => {
    const result = billSchema.safeParse({
      name: 'Rent',
      amount: 1000,
      cadence: 'monthly',
      nextDueDate: '2025-02-30',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('valid date');
    }
  });
});

describe('settingsSchema with date validation', () => {
  it('accepts settings with valid nextPaycheckDate', () => {
    const result = settingsSchema.safeParse({
      percentApply: 'gross',
      payFrequency: 'biweekly',
      paycheckRange: { min: 800, max: 1200 },
      nextPaycheckDate: '2025-01-31',
    });
    expect(result.success).toBe(true);
  });

  it('accepts settings without nextPaycheckDate', () => {
    const result = settingsSchema.safeParse({
      percentApply: 'gross',
      payFrequency: 'biweekly',
      paycheckRange: { min: 800, max: 1200 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects settings with invalid nextPaycheckDate', () => {
    const result = settingsSchema.safeParse({
      percentApply: 'gross',
      payFrequency: 'biweekly',
      paycheckRange: { min: 800, max: 1200 },
      nextPaycheckDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});
