import type { BILL_CADENCES, PAY_FREQUENCIES, BonusIncome } from './types'

type BillInput = {
  name?: string
  amount?: number
  cadence?: (typeof BILL_CADENCES)[number]
  dueDay?: number
}

type GoalInput = { name?: string; type?: 'percent' | 'fixed'; value?: number }

export type AllocationOptions = {
  percentApply?: 'gross' | 'remainder'
  payFrequency?: (typeof PAY_FREQUENCIES)[number]
  paycheckRange?: { min: number; max: number }
  bonuses?: BonusIncome[]
  upcomingDays?: number
  currentDate?: Date // For calculating due date urgency
}

export type AllocatedBill = {
  name: string
  required: number
  allocated: number
  remaining: number
  daysUntilDue?: number
  isUrgent?: boolean
}

export type AllocatedGoal = {
  name: string
  type: 'percent' | 'fixed'
  value?: number
  desired: number
  allocated: number
}

export type AllocationResult = {
  bills: AllocatedBill[]
  goals: AllocatedGoal[]
  guilt_free: number
  meta: {
    paycheck: number
    effective_paycheck: number
    remaining_after_bills: number
    variance_pct: number
    supplemental_income: number
  }
}

/**
 * Round a number to 2 decimal places for currency display.
 * Adds small epsilon (1e-12) to handle floating point precision errors.
 * For example: 0.1 + 0.2 = 0.30000000000000004 becomes 0.30
 * This is sufficient for typical financial calculations under $1M.
 * For high-precision requirements, consider using a decimal library like decimal.js.
 */
function _round2(x: number): number {
  return Math.round((x + 1e-12) * 100) / 100
}

const daysPerCadence: Record<(typeof BILL_CADENCES)[number], number> = {
  every_paycheck: 14,
  weekly: 7,
  biweekly: 14,
  semi_monthly: 15,
  monthly: 30,
  quarterly: 90,
  annual: 365
}

const getUpcomingNeed = (amount: number, cadence: (typeof BILL_CADENCES)[number] | undefined, daysAhead: number, daysUntilDue?: number): number => {
  // If we have a specific due date and it's within the upcoming period, need full amount
  if (daysUntilDue !== undefined && daysUntilDue <= daysAhead) {
    return amount
  }
  
  // Otherwise use time-based estimation
  const cadenceDays = daysPerCadence[cadence ?? 'monthly']
  if (cadenceDays <= 0) return amount
  const ratio = daysAhead / cadenceDays
  return Math.min(amount, amount * ratio)
}

const getExpectedBonus = (bonus: BonusIncome, daysAhead: number): number => {
  const cadenceDays = daysPerCadence[bonus.cadence]
  if (cadenceDays <= 0) return 0
  const expected = (bonus.range.min + bonus.range.max) / 2
  const ratio = Math.min(1, daysAhead / cadenceDays)
  return expected * ratio
}

/**
 * Calculate days until a bill is due based on its due day and current date.
 * For monthly bills with a dueDay, calculates actual days until that day of month.
 * Returns undefined if no due day specified.
 * Handles edge case where dueDay (e.g., 31) exceeds days in target month.
 */
const getDaysUntilDue = (bill: BillInput, currentDate: Date): number | undefined => {
  if (bill.cadence !== 'monthly' || !bill.dueDay) return undefined
  
  const today = currentDate.getDate()
  const requestedDueDay = bill.dueDay
  
  // Clamp due day to valid range for current month
  const daysInCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const effectiveDueDay = Math.min(requestedDueDay, daysInCurrentMonth)
  
  // If due day is later this month (or today)
  if (effectiveDueDay >= today) {
    return effectiveDueDay - today
  }
  
  // Due day already passed this month - calculate for next month
  const daysLeftInMonth = daysInCurrentMonth - today
  const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
  const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()
  const effectiveDueDayNextMonth = Math.min(requestedDueDay, daysInNextMonth)
  
  return daysLeftInMonth + effectiveDueDayNextMonth
}

/**
 * Allocate a paycheck across bills and goals using the waterfall method.
 * 
 * This function implements the core allocation logic:
 * 1. Apply paycheck variance cushion if configured
 * 2. Sort bills by urgency (due date)
 * 3. Allocate funds to bills until depleted or all bills funded
 * 4. Calculate desired goal amounts (percent of gross or remainder)
 * 5. Proportionally allocate remaining funds to goals
 * 6. Return guilt-free spending amount
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
 *   [{ name: 'Rent', amount: 1000, cadence: 'monthly' }],
 *   [{ name: 'Savings', type: 'percent', value: 10 }],
 *   { percentApply: 'gross', upcomingDays: 14 }
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
  if (paycheckAmount < 0) throw new Error('paycheck_amount must be non-negative')

  const percentApply = options.percentApply ?? 'gross'
  const paycheckRange = options.paycheckRange ?? { min: paycheckAmount, max: paycheckAmount }
  const upcomingDays = options.upcomingDays ?? 14
  const bonuses = options.bonuses ?? []
  const currentDate = options.currentDate ?? new Date()

  const cushion = Math.max(0, paycheckRange.max - paycheckAmount)
  const effectivePaycheck = _round2(Math.max(0, paycheckAmount - cushion))
  const expectedBonuses = bonuses.reduce((sum, bonus) => sum + getExpectedBonus(bonus, upcomingDays), 0)
  let remaining = _round2(effectivePaycheck + expectedBonuses)
  
  // Calculate urgency for each bill and create sorting key
  type BillWithUrgency = BillInput & { 
    daysUntilDue?: number
    sortKey: number // Lower = more urgent
  }
  
  const billsWithUrgency: BillWithUrgency[] = bills.map(b => {
    const daysUntilDue = getDaysUntilDue(b, currentDate)
    return {
      ...b,
      daysUntilDue,
      // Bills with due dates sort by days until due, bills without sort to end
      sortKey: daysUntilDue !== undefined ? daysUntilDue : 999
    }
  })
  
  // Sort bills by urgency (due soonest first)
  billsWithUrgency.sort((a, b) => a.sortKey - b.sortKey)
  
  const billsOut: AllocatedBill[] = []
  for (const b of billsWithUrgency) {
    const cadence = b.cadence ?? 'monthly'
    const amount = Number(b.amount ?? 0)
    const daysUntilDue = b.daysUntilDue
    const required = _round2(getUpcomingNeed(amount, cadence, upcomingDays, daysUntilDue))
    const alloc = Math.min(remaining, required)
    remaining -= alloc
    
    const isUrgent = daysUntilDue !== undefined && daysUntilDue <= upcomingDays
    
    billsOut.push({
      name: b.name ?? '',
      required: _round2(required),
      allocated: _round2(alloc),
      remaining: _round2(required - alloc),
      daysUntilDue,
      isUrgent
    })
  }

  const remainingAfterBills = _round2(remaining)

  const baseForPercent = percentApply === 'gross' ? remaining + billsOut.reduce((s, b) => s + b.allocated, 0) : remainingAfterBills

  const goalsDesired: AllocatedGoal[] = goals.map((g) => {
    const gtype = g.type ?? 'percent'
    let desired = 0
    if (gtype === 'percent') {
      const pct = Number(g.value ?? 0) / 100
      desired = _round2(pct * baseForPercent)
    } else {
      desired = _round2(Number(g.value ?? 0))
    }
    return {
      name: g.name ?? '',
      type: gtype,
      value: g.value,
      desired,
      allocated: 0
    }
  })

  const desiredTotal = goalsDesired.reduce((s, g) => s + g.desired, 0)
  const cap = Math.min(desiredTotal, remainingAfterBills)

  let guiltFree = remainingAfterBills

  if (desiredTotal <= 0 || cap <= 0) {
    for (const g of goalsDesired) g.allocated = 0
    guiltFree = remainingAfterBills
  } else {
    const factor = desiredTotal > 0 ? cap / desiredTotal : 0
    let allocatedSum = 0
    for (const g of goalsDesired) {
      const alloc = _round2(g.desired * factor)
      g.allocated = alloc
      allocatedSum += alloc
    }

    const roundingGap = _round2(cap - allocatedSum)
    if (Math.abs(roundingGap) >= 0.01 && goalsDesired.length > 0) {
      goalsDesired[0].allocated = _round2(goalsDesired[0].allocated + roundingGap)
    }

    guiltFree = _round2(remainingAfterBills - goalsDesired.reduce((s, g) => s + g.allocated, 0))
  }

  return {
    bills: billsOut,
    goals: goalsDesired,
    guilt_free: _round2(guiltFree),
    meta: {
      paycheck: _round2(paycheckAmount),
      effective_paycheck: effectivePaycheck,
      remaining_after_bills: remainingAfterBills,
      variance_pct: cushion === 0 ? 0 : _round2((cushion / Math.max(paycheckAmount, 1)) * 100),
      supplemental_income: expectedBonuses
    }
  }
}

