import { describe, it, expect } from 'vitest';
import { allocatePaycheck } from '../src/lib/allocations';

describe('allocatePaycheck - edge cases', () => {
  describe('overdue bills', () => {
    it('handles bills with negative days until due', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const out = allocatePaycheck(
        1000,
        [
          {
            name: 'Overdue',
            amount: 500,
            cadence: 'monthly',
            nextDueDate: pastDate.toISOString().split('T')[0],
          },
        ],
        [],
        { upcomingDays: 14 }
      );

      expect(out.bills[0].daysUntilDue).toBeLessThan(0);
      expect(out.bills[0].allocated).toBeGreaterThan(0);
    });

    it('prioritizes overdue bills first', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const out = allocatePaycheck(
        800,
        [
          {
            name: 'Future Bill',
            amount: 500,
            cadence: 'monthly',
            nextDueDate: futureDate.toISOString().split('T')[0],
          },
          {
            name: 'Overdue Bill',
            amount: 600,
            cadence: 'monthly',
            nextDueDate: pastDate.toISOString().split('T')[0],
          },
        ],
        [],
        { nextPaycheckDate: futureDate.toISOString().split('T')[0] }
      );

      // Overdue bill should be first in results
      expect(out.bills[0].name).toBe('Overdue Bill');
      expect(out.bills[0].allocated).toBe(600);
      expect(out.bills[1].allocated).toBe(200);
    });
  });

  describe('leap year handling', () => {
    it('handles Feb 29 in leap year', () => {
      const out = allocatePaycheck(
        1000,
        [{ name: 'Rent', amount: 500, cadence: 'monthly', dueDay: 29 }],
        [],
        { currentDate: new Date(2024, 1, 15), upcomingDays: 14 }
      );

      expect(out.bills[0].allocated).toBeGreaterThan(0);
    });

    it('handles dueDay 29-31 in February (non-leap)', () => {
      const out = allocatePaycheck(
        1000,
        [{ name: 'Rent', amount: 500, cadence: 'monthly', dueDay: 31 }],
        [],
        { currentDate: new Date(2025, 1, 15), upcomingDays: 14 } // Feb 2025
      );

      // Should map to Feb 28
      expect(out.bills[0].allocated).toBeGreaterThan(0);
    });

    it('handles transition from Jan 31 to Feb 28', () => {
      const out = allocatePaycheck(
        1000,
        [{ name: 'Monthly Bill', amount: 500, cadence: 'monthly', dueDay: 31 }],
        [],
        { currentDate: new Date(2025, 0, 31), upcomingDays: 30 } // Jan 31, 2025
      );

      expect(out.bills[0].allocated).toBeGreaterThan(0);
    });
  });

  describe('same-day bills', () => {
    it('prioritizes larger bills when due on same day', () => {
      const dueDate = '2025-02-15';
      const out = allocatePaycheck(
        1000,
        [
          {
            name: 'Small Bill',
            amount: 300,
            cadence: 'monthly',
            nextDueDate: dueDate,
          },
          {
            name: 'Large Bill',
            amount: 800,
            cadence: 'monthly',
            nextDueDate: dueDate,
          },
          {
            name: 'Medium Bill',
            amount: 500,
            cadence: 'monthly',
            nextDueDate: dueDate,
          },
        ],
        [],
        {
          currentDate: new Date(2025, 1, 10),
          nextPaycheckDate: '2025-02-20',
        }
      );

      // Should be sorted: Large, Medium, Small
      expect(out.bills[0].name).toBe('Large Bill');
      expect(out.bills[0].allocated).toBe(800);
      expect(out.bills[1].name).toBe('Medium Bill');
      expect(out.bills[1].allocated).toBe(200);
      expect(out.bills[2].name).toBe('Small Bill');
      expect(out.bills[2].allocated).toBe(0);
    });
  });

  describe('extreme values', () => {
    it('handles very large paycheck amounts', () => {
      const out = allocatePaycheck(
        150000, // $150K paycheck
        [{ name: 'Rent', amount: 5000, cadence: 'monthly' }],
        [{ name: 'Invest', type: 'percent', value: 10 }],
        { upcomingDays: 30 }
      );

      expect(out.bills[0].allocated).toBe(5000);
      expect(out.goals[0].allocated).toBe(15000);
      expect(out.guilt_free).toBe(130000);
    });

    it('handles zero-amount bills', () => {
      const out = allocatePaycheck(
        1000,
        [{ name: 'Free Service', amount: 0, cadence: 'monthly' }],
        [],
        { upcomingDays: 30 }
      );

      expect(out.bills[0].allocated).toBe(0);
      expect(out.guilt_free).toBe(1000);
    });

    it('handles zero-amount goals', () => {
      const out = allocatePaycheck(
        1000,
        [],
        [{ name: 'Paused Goal', type: 'fixed', value: 0 }],
        { upcomingDays: 30 }
      );

      expect(out.goals[0].allocated).toBe(0);
      expect(out.guilt_free).toBe(1000);
    });

    it('handles zero paycheck gracefully', () => {
      const out = allocatePaycheck(
        0,
        [{ name: 'Rent', amount: 1000, cadence: 'monthly' }],
        [{ name: 'Savings', type: 'percent', value: 10 }],
        { upcomingDays: 30 }
      );

      expect(out.bills[0].allocated).toBe(0);
      expect(out.goals[0].allocated).toBe(0);
      expect(out.guilt_free).toBe(0);
    });

    it('handles very small paycheck amounts', () => {
      const out = allocatePaycheck(
        0.01, // 1 cent
        [{ name: 'Rent', amount: 1000, cadence: 'monthly' }],
        [],
        { upcomingDays: 30 }
      );

      expect(out.bills[0].allocated).toBe(0.01);
      expect(out.guilt_free).toBe(0);
    });
  });

  describe('multiple bonus sources', () => {
    it('combines bonuses with different cadences correctly', () => {
      const out = allocatePaycheck(
        2000,
        [{ name: 'Rent', amount: 1000, cadence: 'monthly' }],
        [],
        {
          bonuses: [
            {
              name: 'Commission',
              cadence: 'monthly',
              range: { min: 200, max: 400 },
              recurring: true,
            },
            {
              name: 'Tips',
              cadence: 'weekly',
              range: { min: 50, max: 100 },
              recurring: true,
            },
          ],
          upcomingDays: 14,
        }
      );

      // Should include prorated portions of both bonuses
      expect(out.meta.supplemental_income).toBeGreaterThan(0);
      expect(out.guilt_free).toBeGreaterThan(1000);
    });

    it('handles bonus with zero range', () => {
      const out = allocatePaycheck(
        2000,
        [{ name: 'Rent', amount: 1000, cadence: 'monthly' }],
        [],
        {
          bonuses: [
            {
              name: 'No Bonus',
              cadence: 'monthly',
              range: { min: 0, max: 0 },
              recurring: true,
            },
          ],
          upcomingDays: 14,
        }
      );

      expect(out.meta.supplemental_income).toBe(0);
    });
  });

  describe('daylight saving transitions', () => {
    it('handles DST spring forward correctly', () => {
      // March 10, 2024, 1 AM - DST begins at 2 AM
      const dstDate = new Date(2024, 2, 10, 1, 0, 0);
      const out = allocatePaycheck(
        1000,
        [
          {
            name: 'Bill',
            amount: 500,
            cadence: 'monthly',
            nextDueDate: '2024-03-15',
          },
        ],
        [],
        { currentDate: dstDate, nextPaycheckDate: '2024-03-24' }
      );

      expect(out.bills[0].daysUntilDue).toBe(5);
    });

    it('handles DST fall back correctly', () => {
      // November 3, 2024, 1 AM - DST ends at 2 AM
      const dstDate = new Date(2024, 10, 3, 1, 0, 0);
      const out = allocatePaycheck(
        1000,
        [
          {
            name: 'Bill',
            amount: 500,
            cadence: 'monthly',
            nextDueDate: '2024-11-08',
          },
        ],
        [],
        { currentDate: dstDate, nextPaycheckDate: '2024-11-17' }
      );

      expect(out.bills[0].daysUntilDue).toBe(5);
    });
  });

  describe('every_paycheck cadence', () => {
    it('requires full amount for every_paycheck bills', () => {
      const out = allocatePaycheck(
        500,
        [{ name: 'Gas', amount: 200, cadence: 'every_paycheck' }],
        [],
        { payFrequency: 'biweekly', upcomingDays: 14 }
      );

      expect(out.bills[0].required).toBe(200);
      expect(out.bills[0].allocated).toBe(200);
    });

    it('allocates bills with mixed cadences', () => {
      const out = allocatePaycheck(
        600,
        [
          { name: 'Gas', amount: 300, cadence: 'every_paycheck' },
          { name: 'Rent', amount: 1000, cadence: 'monthly' },
        ],
        [],
        { payFrequency: 'biweekly', upcomingDays: 14 }
      );

      // Find allocations regardless of order
      const gasBill = out.bills.find((b) => b.name === 'Gas');
      const rentBill = out.bills.find((b) => b.name === 'Rent');
      
      // Gas requires full 300 for every_paycheck cadence
      expect(gasBill?.required).toBe(300);
      // Rent is prorated: 1000 * (14/30) = ~467
      expect(rentBill?.required).toBeCloseTo(466.67, 1);
      
      // Total available is 600, so both get partial funding
      // They should add up to 600
      const totalAllocated = (gasBill?.allocated ?? 0) + (rentBill?.allocated ?? 0);
      expect(totalAllocated).toBeCloseTo(600, 1);
    });
  });

  describe('bill without name', () => {
    it('handles bills with empty name gracefully', () => {
      const out = allocatePaycheck(
        1000,
        [{ name: '', amount: 500, cadence: 'monthly' }],
        [],
        { upcomingDays: 30 }
      );

      expect(out.bills[0].name).toBe('');
      expect(out.bills[0].allocated).toBe(500);
    });

    it('handles bills with undefined name', () => {
      const out = allocatePaycheck(
        1000,
        [{ amount: 500, cadence: 'monthly' }],
        [],
        { upcomingDays: 30 }
      );

      expect(out.bills[0].name).toBe('');
      expect(out.bills[0].allocated).toBe(500);
    });
  });

  describe('goal edge cases', () => {
    it('handles goals without name gracefully', () => {
      const out = allocatePaycheck(
        1000,
        [],
        [{ name: '', type: 'fixed', value: 200 }],
        { upcomingDays: 30 }
      );

      expect(out.goals[0].name).toBe('');
      expect(out.goals[0].allocated).toBe(200);
    });

    it('handles 100% goal correctly', () => {
      const out = allocatePaycheck(
        1000,
        [],
        [{ name: 'Save All', type: 'percent', value: 100 }],
        { percentApply: 'gross', upcomingDays: 30 }
      );

      expect(out.goals[0].allocated).toBe(1000);
      expect(out.guilt_free).toBe(0);
    });

    it('handles percent goal > 100%', () => {
      const out = allocatePaycheck(
        1000,
        [],
        [{ name: 'Aggressive', type: 'percent', value: 150 }],
        { percentApply: 'gross', upcomingDays: 30 }
      );

      // Desired will be 1500, but only 1000 available
      expect(out.goals[0].desired).toBe(1500);
      expect(out.goals[0].allocated).toBe(1000);
      expect(out.guilt_free).toBe(0);
    });
  });

  describe('paycheck range edge cases', () => {
    it('handles range where min equals max', () => {
      const out = allocatePaycheck(
        1000,
        [{ name: 'Rent', amount: 500, cadence: 'monthly' }],
        [],
        { paycheckRange: { min: 1000, max: 1000 }, upcomingDays: 30 }
      );

      expect(out.meta.baseline_from_minimum).toBe(1000);
      expect(out.meta.extra_allocated).toBe(0);
    });

    it('handles paycheck above maximum in range', () => {
      const out = allocatePaycheck(
        2000,
        [{ name: 'Rent', amount: 1500, cadence: 'monthly' }],
        [],
        { paycheckRange: { min: 800, max: 1200 }, upcomingDays: 30 }
      );

      // Baseline should be 800 (minimum)
      expect(out.meta.baseline_from_minimum).toBe(800);
      // Extra = 2000 - 800 = 1200, some should be allocated to cover full rent
      expect(out.meta.extra_allocated).toBeGreaterThan(0);
      // Rent should get 1500 total (800 from baseline + 700 from extra)
      expect(out.bills[0].allocated).toBe(1500);
    });
  });

  describe('date parsing edge cases', () => {
    it('handles bills with only dueDay (legacy)', () => {
      const out = allocatePaycheck(
        1000,
        [{ name: 'Legacy Bill', amount: 500, cadence: 'monthly', dueDay: 15 }],
        [],
        { currentDate: new Date(2025, 0, 10), upcomingDays: 14 }
      );

      expect(out.bills[0].allocated).toBeGreaterThan(0);
    });

    it('handles bills with both dueDay and nextDueDate (nextDueDate wins)', () => {
      const out = allocatePaycheck(
        1000,
        [
          {
            name: 'Bill',
            amount: 500,
            cadence: 'monthly',
            dueDay: 5, // This should be ignored
            nextDueDate: '2025-01-20', // This should be used
          },
        ],
        [],
        { currentDate: new Date('2025-01-10'), upcomingDays: 14 }
      );

      // Days until due should be around 10 (may vary by timezone)
      expect(out.bills[0].daysUntilDue).toBeGreaterThanOrEqual(9);
      expect(out.bills[0].daysUntilDue).toBeLessThanOrEqual(11);
    });
  });

  describe('rounding and precision', () => {
    it('handles amounts that would cause floating point errors', () => {
      const out = allocatePaycheck(
        0.1 + 0.2, // Classic floating point example
        [{ name: 'Test', amount: 0.1, cadence: 'monthly' }],
        [],
        { upcomingDays: 30 }
      );

      // Should be rounded to 2 decimals
      expect(out.meta.paycheck).toBe(0.3);
      expect(out.bills[0].allocated).toBe(0.1);
    });

    it('maintains precision through complex calculations', () => {
      const out = allocatePaycheck(
        1234.56,
        [
          { name: 'Bill1', amount: 123.45, cadence: 'monthly' },
          { name: 'Bill2', amount: 234.56, cadence: 'monthly' },
        ],
        [{ name: 'Goal', type: 'percent', value: 12.5 }],
        { percentApply: 'gross', upcomingDays: 30 }
      );

      const totalAllocated =
        out.bills.reduce((sum, b) => sum + b.allocated, 0) +
        out.goals.reduce((sum, g) => sum + g.allocated, 0) +
        out.guilt_free;

      // Total should equal paycheck (within floating point tolerance)
      expect(Math.abs(totalAllocated - 1234.56)).toBeLessThan(0.01);
    });
  });
});
