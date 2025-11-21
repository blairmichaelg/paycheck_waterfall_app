import { describe, it, expect } from 'vitest'
import { allocatePaycheck } from '../src/lib/allocations'

describe('allocatePaycheck', () => {
  it('allocates bills based on upcoming days', () => {
    const out = allocatePaycheck(
      1500,
      [
        { name: 'Rent', amount: 1000, cadence: 'monthly' },
        { name: 'Utilities', amount: 200, cadence: 'monthly' }
      ],
      [],
      { upcomingDays: 30 }
    )
    expect(out.bills[0].required).toBe(1000)
    expect(out.bills[0].allocated).toBe(1000)
    expect(out.bills[1].required).toBe(200)
    expect(out.bills[1].allocated).toBe(200)
    expect(out.guilt_free).toBe(300)
  })

  it('partial bill funding based on available funds', () => {
    const out = allocatePaycheck(
      900,
      [
        { name: 'Rent', amount: 1000, cadence: 'monthly' },
        { name: 'Utilities', amount: 200, cadence: 'monthly' }
      ],
      [],
      { upcomingDays: 30 }
    )
    expect(out.bills[0].allocated).toBe(900)
    expect(out.bills[0].remaining).toBeGreaterThan(0)
    expect(out.bills[1].allocated).toBe(0)
    expect(out.guilt_free).toBe(0)
  })

  it('percent goal on gross', () => {
    const out = allocatePaycheck(
      1000,
      [{ name: 'Rent', amount: 400, cadence: 'monthly' }],
      [{ name: 'Invest', type: 'percent', value: 10 }],
      { percentApply: 'gross', upcomingDays: 30 }
    )
    expect(out.goals[0].desired).toBe(100)
    expect(out.goals[0].allocated).toBe(100)
    expect(out.guilt_free).toBe(500)
  })

  it('percent goal on remainder', () => {
    const out = allocatePaycheck(
      1000,
      [{ name: 'Rent', amount: 400, cadence: 'monthly' }],
      [{ name: 'Invest', type: 'percent', value: 10 }],
      { percentApply: 'remainder', upcomingDays: 30 }
    )
    const expectedDesired = (1000 - 400) * 0.1
    expect(out.goals[0].desired).toBe(expectedDesired)
    expect(out.goals[0].allocated).toBe(expectedDesired)
    expect(out.guilt_free).toBeCloseTo(1000 - 400 - expectedDesired, 2)
  })

  it('goals are funded proportionally when exceeding remainder', () => {
    const out = allocatePaycheck(
      500,
      [{ name: 'Rent', amount: 200, cadence: 'monthly' }],
      [
        { name: 'A', type: 'fixed', value: 200 },
        { name: 'B', type: 'fixed', value: 200 }
      ],
      { upcomingDays: 30 }
    )
    const allocatedTotal = out.goals.reduce((s: number, g: any) => s + g.allocated, 0)
    expect(allocatedTotal).toBe(300)
    expect(out.guilt_free).toBe(0)
  })

  it('uses paycheck range minimum as baseline', () => {
    const out = allocatePaycheck(
      1000,
      [{ name: 'Rent', amount: 500, cadence: 'monthly' }],
      [],
      { paycheckRange: { min: 800, max: 1200 }, upcomingDays: 30 }
    )
    expect(out.meta.baseline_from_minimum).toBe(800)
    expect(out.meta.extra_allocated).toBeGreaterThanOrEqual(0)
  })

  it('includes bonus income in calculations', () => {
    const out = allocatePaycheck(
      1000,
      [{ name: 'Rent', amount: 500, cadence: 'monthly' }],
      [],
      {
        bonuses: [{ name: 'Commission', cadence: 'monthly', range: { min: 100, max: 200 }, recurring: true }],
        upcomingDays: 30
      }
    )
    expect(out.meta.supplemental_income).toBeGreaterThan(0)
    expect(out.guilt_free).toBeGreaterThan(500)
  })

  it('negative paycheck throws', () => {
    expect(() => allocatePaycheck(-100, [], [])).toThrow()
  })

  it('prioritizes bills by due date urgency', () => {
    // Test with bills due on different days - using ISO strings for consistent timezone handling
    const testDate = new Date('2025-01-10')
    const nextPaycheck = new Date('2025-01-24') // Jan 24, 2025 (14 days later)
    const out = allocatePaycheck(
      600,
      [
        { name: 'Rent', amount: 1000, cadence: 'monthly', dueDay: 15 }, // Due in ~5 days (urgent - before next paycheck)
        { name: 'Electric', amount: 300, cadence: 'monthly', dueDay: 25 }, // Due in ~15 days (not urgent - after next paycheck)
        { name: 'Internet', amount: 100, cadence: 'monthly', dueDay: 5 } // Already passed, due in ~26 days
      ],
      [],
      { upcomingDays: 14, currentDate: testDate, nextPaycheckDate: nextPaycheck.toISOString() }
    )
    
    // Rent should be first (most urgent - due before next paycheck)
    expect(out.bills[0].name).toBe('Rent')
    expect(out.bills[0].daysUntilDue).toBeGreaterThanOrEqual(4)
    expect(out.bills[0].daysUntilDue).toBeLessThanOrEqual(6)
    expect(out.bills[0].isUrgent).toBe(true)
    
    // Electric should be second
    expect(out.bills[1].name).toBe('Electric')
    expect(out.bills[1].daysUntilDue).toBeGreaterThanOrEqual(14)
    expect(out.bills[1].daysUntilDue).toBeLessThanOrEqual(16)
    expect(out.bills[1].isUrgent).toBe(false)
    
    // Internet should be last (already passed this month)
    expect(out.bills[2].name).toBe('Internet')
    expect(out.bills[2].daysUntilDue).toBeGreaterThan(20)
    expect(out.bills[2].isUrgent).toBe(false)
    
    // Rent gets funded first
    expect(out.bills[0].allocated).toBe(600)
    expect(out.bills[1].allocated).toBe(0)
  })

  it('handles paycheck below minimum without excessive cushion', () => {
    const bills = [{ name: 'Rent', amount: 500, cadence: 'monthly' as const }]
    const goals: never[] = []
    
    // Range is 800-1200, but paycheck is only 600 (below min)
    const out = allocatePaycheck(600, bills, goals, {
      paycheckRange: { min: 800, max: 1200 }
    })
    
    // Should use full paycheck as baseline when below minimum
    expect(out.meta.baseline_from_minimum).toBe(600)
    expect(out.meta.extra_allocated).toBe(0)
    
    // Should allocate as much as possible from the low paycheck
    expect(out.bills[0].allocated).toBeGreaterThan(0)
    expect(out.bills[0].allocated).toBeLessThanOrEqual(600)
  })

  it('prioritizes larger bills when due on same day (stable sort)', () => {
    const testDate = new Date(2025, 0, 10)
    const nextPaycheck = new Date(2025, 0, 24)
    
    const out = allocatePaycheck(
      1000,
      [
        { name: 'Small', amount: 200, cadence: 'monthly', dueDay: 15 },
        { name: 'Large', amount: 800, cadence: 'monthly', dueDay: 15 },
        { name: 'Medium', amount: 500, cadence: 'monthly', dueDay: 15 },
      ],
      [],
      { currentDate: testDate, nextPaycheckDate: nextPaycheck.toISOString(), upcomingDays: 14 }
    )
    
    // Should fund in order: Large, Medium, Small
    expect(out.bills[0].name).toBe('Large')
    expect(out.bills[0].allocated).toBe(800)
    expect(out.bills[1].name).toBe('Medium')
    expect(out.bills[1].allocated).toBe(200) // Partial
    expect(out.bills[2].name).toBe('Small')
    expect(out.bills[2].allocated).toBe(0) // Unfunded
  })

  it('monthly bills require full amount when due within 30 days (not prorated)', () => {
    // This matches user expectations: pay monthly bills in full, not prorated across biweekly paychecks
    const testDate = new Date(2025, 10, 21) // Nov 21, 2025
    const out = allocatePaycheck(
      1924,
      [
        { name: 'Zombie Burger', amount: 100, cadence: 'monthly', dueDay: 1 }, // Due Dec 1 (10 days)
        { name: 'Court Fees', amount: 136, cadence: 'monthly', dueDay: 1 },
      ],
      [],
      { payFrequency: 'biweekly', upcomingDays: 14, currentDate: testDate }
    )
    
    // Should require FULL amount for monthly bills due within 30 days
    const zombieBurger = out.bills.find((b) => b.name === 'Zombie Burger')
    const courtFees = out.bills.find((b) => b.name === 'Court Fees')
    
    expect(zombieBurger?.required).toBe(100) // Full amount, not prorated
    expect(courtFees?.required).toBe(136) // Full amount, not prorated
  })
})
