type Bill = { name?: string; amount?: number }
type Goal = { name?: string; type?: 'percent' | 'fixed'; value?: number }

function _round2(x: number): number {
  return Math.round((x + 1e-12) * 100) / 100
}

export function allocatePaycheck(
  paycheckAmount: number,
  bills: Bill[] = [],
  goals: Goal[] = [],
  percentApply: 'gross' | 'remainder' = 'gross'
) {
  if (paycheckAmount < 0) throw new Error('paycheck_amount must be non-negative')

  let remaining = Number(paycheckAmount)
  const billsOut = [] as any[]
  for (const b of bills) {
    const required = Number(b.amount ?? 0)
    const alloc = Math.min(remaining, required)
    remaining -= alloc
    billsOut.push({
      name: b.name ?? '',
      required: _round2(required),
      allocated: _round2(alloc),
      remaining: _round2(required - alloc)
    })
  }

  const remainingAfterBills = _round2(remaining)

  const baseForPercent = percentApply === 'gross' ? Number(paycheckAmount) : remainingAfterBills

  const goalsDesired = goals.map((g) => {
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
      remaining_after_bills: remainingAfterBills
    }
  }
}

export type { Bill, Goal }
