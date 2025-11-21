import type { BILL_CADENCES, PAY_FREQUENCIES, BonusIncome } from './types';
import { daysBetweenUTC } from './dateUtils';

type BillInput = {
  name?: string;
  amount?: number;
  cadence?: (typeof BILL_CADENCES)[number];
  dueDay?: number; // Legacy - converted to nextDueDate internally
  nextDueDate?: string; // ISO date string - when is this bill next due?
};

type GoalInput = { name?: string; type?: 'percent' | 'fixed'; value?: number };

export type AllocationOptions = {
  percentApply?: 'gross' | 'remainder';
  payFrequency?: (typeof PAY_FREQUENCIES)[number];
  paycheckRange?: { min: number; max: number };
  bonuses?: BonusIncome[];
  upcomingDays?: number; // Legacy - used as fallback when nextPaycheckDate unavailable
  currentDate?: Date;
  nextPaycheckDate?: string; // ISO date string - when's the next paycheck?
};

export type AllocatedBill = {
  name: string;
  required: number;
  allocated: number;
  remaining: number;
  daysUntilDue?: number;
  isUrgent?: boolean;
};

export type AllocatedGoal = {
  name: string;
  type: 'percent' | 'fixed';
  value?: number;
  desired: number;
  allocated: number;
};

export type AllocationResult = {
  bills: AllocatedBill[];
  goals: AllocatedGoal[];
  guilt_free: number;
  spending_tracked?: number; // Optional: track spending against guilt-free amount
  meta: {
    paycheck: number;
    baseline_from_minimum: number; // What we allocated from minimum
    extra_allocated: number; // Extra money allocated above minimum
    remaining_after_bills: number;
    supplemental_income: number;
  };
};

/**
 * Round a number to 2 decimal places for currency display.
 *
 * PRECISION NOTES:
 * - Uses standard IEEE 754 floating-point arithmetic
 * - Precision is maintained throughout calculations, rounded only at output
 * - Cumulative errors typically < $0.01 for amounts under $100,000
 * - For high-precision requirements (hedge funds, accounting systems),
 *   consider using a decimal library like decimal.js or big.js
 *
 * SUFFICIENT FOR:
 * ✅ Personal budgeting (<$10K/month paychecks)
 * ✅ Small business payroll (<$50K/month)
 * ✅ Standard consumer finance applications
 *
 * LIMITATIONS:
 * ⚠️ Not suitable for high-frequency trading or scientific calculations
 * ⚠️ Avoid using for legal/tax calculations requiring exact cent precision
 *
 * @param x - The number to round
 * @returns Number rounded to 2 decimal places
 * @example
 * _round2(10.567) // 10.57
 * _round2(0.1 + 0.2) // 0.3 (not 0.30000000000000004)
 */
function _round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/**
 * Average days per cadence. For 'every_paycheck' and 'one_time', handle separately.
 */
const daysPerCadence: Record<Exclude<(typeof BILL_CADENCES)[number], 'every_paycheck' | 'one_time'>, number> = {
  weekly: 7,
  biweekly: 14,
  semi_monthly: 15,
  monthly: 30,
  quarterly: 90,
  annual: 365,
};

/**
 * Get days between paychecks based on pay frequency.
 */
function getDaysPerPaycheck(payFrequency?: (typeof PAY_FREQUENCIES)[number]): number {
  switch (payFrequency) {
    case 'weekly':
      return 7;
    case 'biweekly':
      return 14;
    case 'semi_monthly':
      return 15;
    case 'monthly':
      return 30;
    default:
      return 14; // Default to biweekly
  }
}

/**
 * Calculate how much of a bill is needed based on when it's due.
 * 
 * LOGIC:
 * 1. One-time bills: full amount (pay it once and done)
 * 2. If bill is due within the paycheck window → full amount
 * 3. For monthly bills: if due within ~30 days → full amount (user expects to pay monthly bills in full)
 * 4. For 'every_paycheck': full amount
 * 5. Otherwise: prorate based on time until next paycheck
 */
const calculateBillPortionNeeded = (
  amount: number,
  cadence: (typeof BILL_CADENCES)[number] | undefined,
  daysAhead: number,
  daysUntilDue?: number,
  _payFrequency?: (typeof PAY_FREQUENCIES)[number]
): number => {
  // One-time bills always need full amount
  if (cadence === 'one_time') {
    return amount;
  }

  // If we have a specific due date and it's within the upcoming period, need full amount
  if (daysUntilDue !== undefined && daysUntilDue <= daysAhead) {
    return amount;
  }

  // For 'every_paycheck', use actual pay frequency
  if (cadence === 'every_paycheck') {
    return amount; // Full amount needed every paycheck
  }

  // For monthly bills: if due within ~30 days, require full amount (not prorated)
  // This matches user expectations - you pay monthly bills in full once per month
  if (cadence === 'monthly' && daysUntilDue !== undefined && daysUntilDue <= 30) {
    return amount;
  }

  // Otherwise use time-based estimation
  const cadenceDays = daysPerCadence[cadence as keyof typeof daysPerCadence] ?? 30;
  if (cadenceDays <= 0) return amount;
  const ratio = daysAhead / cadenceDays;
  return Math.min(amount, amount * ratio);
};

/**
 * Calculate expected bonus income prorated for the time window.
 * Uses midpoint of range and prorates based on days until next paycheck.
 */
const getExpectedBonus = (bonus: BonusIncome, daysAhead: number): number => {
  const cadenceDays = daysPerCadence[bonus.cadence as keyof typeof daysPerCadence];
  if (!cadenceDays || cadenceDays <= 0) return 0;
  const expected = (bonus.range.min + bonus.range.max) / 2;
  const ratio = Math.min(1, daysAhead / cadenceDays);
  return expected * ratio;
};

/**
 * Convert legacy dueDay to nextDueDate for consistent processing.
 * For monthly bills with a dueDay, calculates the actual next due date.
 * Handles edge case where dueDay (e.g., 31) exceeds days in target month.
 */
const convertDueDayToNextDueDate = (bill: BillInput, currentDate: Date): string | undefined => {
  if (bill.cadence !== 'monthly' || !bill.dueDay) return undefined;

  const today = currentDate.getDate();
  const requestedDueDay = bill.dueDay;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Try current month first
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const effectiveDueDay = Math.min(requestedDueDay, daysInCurrentMonth);

  let dueDate: Date;
  if (effectiveDueDay >= today) {
    // Due date is later this month
    dueDate = new Date(year, month, effectiveDueDay);
  } else {
    // Due day passed, use next month
    const daysInNextMonth = new Date(year, month + 2, 0).getDate();
    const effectiveDueDayNextMonth = Math.min(requestedDueDay, daysInNextMonth);
    dueDate = new Date(year, month + 1, effectiveDueDayNextMonth);
  }

  return dueDate.toISOString().split('T')[0]; // Return YYYY-MM-DD
};

/**
 * Calculate days until a bill is due.
 * Single source of truth for due date calculations.
 * Uses UTC normalization to prevent time zone edge cases.
 */
const getDaysUntilDue = (dueDate: Date, currentDate: Date): number => {
  return daysBetweenUTC(currentDate, dueDate);
};

/**
 * Allocate a paycheck across bills and goals using the waterfall method.
 *
 * ALLOCATION STRATEGY (waterfall approach):
 * 1. Parse inputs and normalize legacy formats (dueDay → nextDueDate)
 * 2. Prioritize bills by urgency (due before next paycheck, then soonest first)
 * 3. Allocate baseline funds (minimum paycheck + expected bonuses) to bills
 * 4. Allocate extra funds (above minimum):
 *    a. First to urgent bills (due before next paycheck)
 *    b. Then to complete partially-funded bills
 *    c. Remainder flows to goals
 * 5. Calculate goal desires (percent of gross or remainder)
 * 6. Proportionally allocate remaining to goals with fair rounding
 * 7. Return guilt-free spending amount
 *
 * @param paycheckAmount - Gross paycheck amount (must be >= 0)
 * @param bills - List of recurring bills with amounts and cadences
 * @param goals - List of savings/investment goals (percent or fixed amount)
 * @param options - Configuration for allocation behavior
 * @returns Detailed allocation breakdown with guilt-free spending amount
 * @throws Error if paycheckAmount is negative
 *
 * @example
 * ```ts
 * const result = allocatePaycheck(2000,
 *   [{ name: 'Rent', amount: 1000, cadence: 'monthly', nextDueDate: '2025-02-01' }],
 *   [{ name: 'Savings', type: 'percent', value: 10 }],
 *   { percentApply: 'gross', nextPaycheckDate: '2025-01-31' }
 * )
 * console.log(result.guilt_free) // Amount available for guilt-free spending
 * ```
 */
export function allocatePaycheck(
  paycheckAmount: number,
  bills: BillInput[] = [],
  goals: GoalInput[] = [],
  options: AllocationOptions = {}
): AllocationResult {
  if (paycheckAmount < 0) throw new Error('paycheck_amount must be non-negative');

  // ========== PHASE 1: Parse and Normalize Inputs ==========
  const percentApply = options.percentApply ?? 'gross';
  const payFrequency = options.payFrequency;
  const paycheckRange = options.paycheckRange ?? { min: paycheckAmount, max: paycheckAmount };
  const bonuses = options.bonuses ?? [];
  const currentDate = options.currentDate ?? new Date();
  const nextPaycheckDate = options.nextPaycheckDate ? new Date(options.nextPaycheckDate) : null;

  // Calculate days until next paycheck for prorating
  const daysUntilNextPaycheck = nextPaycheckDate
    ? getDaysUntilDue(nextPaycheckDate, currentDate)
    : options.upcomingDays ?? getDaysPerPaycheck(payFrequency);

  // Baseline = minimum paycheck amount (or actual if below minimum)
  const minimum = paycheckRange.min > 0 ? paycheckRange.min : paycheckAmount;
  const baseline = Math.min(paycheckAmount, minimum);
  const extra = Math.max(0, paycheckAmount - minimum);

  // Calculate expected bonus income for this period
  const expectedBonuses = bonuses.reduce(
    (sum, bonus) => sum + getExpectedBonus(bonus, daysUntilNextPaycheck),
    0
  );

  // Available funds = baseline + expected bonuses
  let availableFunds = baseline + expectedBonuses;

  // ========== PHASE 2: Normalize and Prioritize Bills ==========
  type BillWithPriority = BillInput & {
    daysUntilDue?: number;
    isUrgent: boolean;
    sortKey: number; // Lower = more urgent
  };

  const billsWithPriority: BillWithPriority[] = bills.map((b) => {
    // Convert legacy dueDay to nextDueDate for unified processing
    const nextDueDate = b.nextDueDate ?? convertDueDayToNextDueDate(b, currentDate);

    let daysUntilDue: number | undefined;
    let isUrgent = false;

    if (nextDueDate) {
      const dueDate = new Date(nextDueDate);
      daysUntilDue = getDaysUntilDue(dueDate, currentDate);

      // Bill is urgent if due before next paycheck
      if (nextPaycheckDate) {
        isUrgent = dueDate < nextPaycheckDate;
      }
    }

    // Sorting: Urgent bills first (sortKey < 1000), then by days until due
    // Non-urgent bills get sortKey >= 1000
    const sortKey = isUrgent ? daysUntilDue ?? 999 : 1000 + (daysUntilDue ?? 999);

    return {
      ...b,
      daysUntilDue,
      isUrgent,
      sortKey,
    };
  });

  // Sort by priority: urgent + soonest first, then by amount (largest first for same priority)
  billsWithPriority.sort((a, b) => {
    if (a.sortKey !== b.sortKey) {
      return a.sortKey - b.sortKey; // Primary: urgency
    }
    // Secondary: larger bills first (helps user cover big obligations)
    return (b.amount ?? 0) - (a.amount ?? 0);
  });

  // ========== PHASE 3: Allocate to Bills (Single Optimized Pass) ==========
  const billsOut: AllocatedBill[] = [];

  // First pass: Allocate baseline to bills in priority order
  for (const b of billsWithPriority) {
    const cadence = b.cadence ?? 'monthly';
    const amount = Number(b.amount ?? 0);

    // Calculate required amount for this bill
    const required = calculateBillPortionNeeded(
      amount,
      cadence,
      daysUntilNextPaycheck,
      b.daysUntilDue,
      payFrequency
    );

    // Allocate from available baseline funds
    const alloc = Math.min(availableFunds, required);
    availableFunds -= alloc;

    billsOut.push({
      name: b.name ?? '',
      required,
      allocated: alloc,
      remaining: required - alloc,
      daysUntilDue: b.daysUntilDue,
      isUrgent: b.isUrgent,
    });
  }

  // ========== PHASE 4: Allocate Extra Funds Strategically ==========
  // Strategy: Prioritize urgent bills, then complete partially-funded bills
  let extraRemaining = extra;

  // Pass 1: Fund urgent bills first (reduces stress)
  for (const bill of billsOut) {
    if (bill.isUrgent && bill.remaining > 0 && extraRemaining > 0) {
      const additionalAlloc = Math.min(extraRemaining, bill.remaining);
      bill.allocated += additionalAlloc;
      bill.remaining -= additionalAlloc;
      extraRemaining -= additionalAlloc;
    }
  }

  // Pass 2: Complete bills that can be fully funded (satisfying completion)
  for (const bill of billsOut) {
    if (bill.remaining > 0 && extraRemaining >= bill.remaining) {
      const additionalAlloc = bill.remaining;
      bill.allocated += additionalAlloc;
      bill.remaining = 0;
      extraRemaining -= additionalAlloc;
    }
  }

  // Remaining funds after all bill allocation
  const remainingAfterBills = availableFunds + extraRemaining;

  // ========== PHASE 5: Calculate Goal Desires ==========
  const baseForPercent =
    percentApply === 'gross'
      ? baseline + expectedBonuses + extra // Use full paycheck for percent calculation
      : remainingAfterBills;

  const goalsDesired: AllocatedGoal[] = goals.map((g) => {
    const gtype = g.type ?? 'percent';
    let desired = 0;
    if (gtype === 'percent') {
      const pct = Number(g.value ?? 0) / 100;
      desired = pct * baseForPercent;
    } else {
      desired = Number(g.value ?? 0);
    }
    return {
      name: g.name ?? '',
      type: gtype,
      value: g.value,
      desired,
      allocated: 0,
    };
  });

  // ========== PHASE 6: Allocate to Goals Proportionally ==========
  const desiredTotal = goalsDesired.reduce((s, g) => s + g.desired, 0);
  const cap = Math.min(desiredTotal, remainingAfterBills);

  let guiltFree = remainingAfterBills;

  if (desiredTotal <= 0 || cap <= 0) {
    // No goals or no funds remaining
    for (const g of goalsDesired) g.allocated = 0;
    guiltFree = remainingAfterBills;
  } else {
    // Allocate proportionally
    const factor = cap / desiredTotal;
    let allocatedSum = 0;

    for (let i = 0; i < goalsDesired.length; i++) {
      const g = goalsDesired[i];
      // Calculate allocation maintaining precision
      const alloc = g.desired * factor;
      g.allocated = alloc;
      allocatedSum += alloc;
    }

    // Distribute rounding error proportionally (fair distribution)
    const roundingGap = cap - allocatedSum;
    if (Math.abs(roundingGap) >= 0.001 && goalsDesired.length > 0) {
      // Give rounding error to largest goal (most fair distribution)
      const largestGoal = goalsDesired.reduce((max, g) => (g.desired > max.desired ? g : max));
      largestGoal.allocated += roundingGap;
    }

    guiltFree = remainingAfterBills - cap;
  }

  // ========== PHASE 7: Round and Return Results ==========
  return {
    bills: billsOut.map((b) => ({
      ...b,
      required: _round2(b.required),
      allocated: _round2(b.allocated),
      remaining: _round2(b.remaining),
    })),
    goals: goalsDesired.map((g) => ({
      ...g,
      desired: _round2(g.desired),
      allocated: _round2(g.allocated),
    })),
    guilt_free: _round2(guiltFree),
    meta: {
      paycheck: _round2(paycheckAmount),
      baseline_from_minimum: _round2(baseline),
      extra_allocated: _round2(extra - extraRemaining),
      remaining_after_bills: _round2(remainingAfterBills),
      supplemental_income: _round2(expectedBonuses),
    },
  };
}
