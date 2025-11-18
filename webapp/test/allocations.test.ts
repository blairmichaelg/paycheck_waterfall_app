import { describe, it, expect } from 'vitest'
import { allocatePaycheck } from '../src/lib/allocations'

describe('allocatePaycheck', () => {
  it('full bills then guilt free', () => {
    const out = allocatePaycheck(1500, [{ name: 'Rent', amount: 1000 }, { name: 'Utilities', amount: 200 }], [])
    expect(out.bills[0].allocated).toBe(1000)
    expect(out.bills[1].allocated).toBe(200)
    expect(out.guilt_free).toBe(300)
  })

  it('partial bill funding', () => {
    const out = allocatePaycheck(900, [{ name: 'Rent', amount: 1000 }, { name: 'Utilities', amount: 200 }], [])
    expect(out.bills[0].allocated).toBe(900)
    expect(out.bills[0].remaining).toBe(100)
    expect(out.bills[1].allocated).toBe(0)
    expect(out.guilt_free).toBe(0)
  })

  it('percent goal on gross', () => {
    const out = allocatePaycheck(1000, [{ name: 'Rent', amount: 400 }], [{ name: 'Invest', type: 'percent', value: 10 }], 'gross')
    expect(out.goals[0].desired).toBe(100)
    expect(out.goals[0].allocated).toBe(100)
    expect(out.guilt_free).toBe(500)
  })

  it('percent goal on remainder', () => {
    const out = allocatePaycheck(1000, [{ name: 'Rent', amount: 400 }], [{ name: 'Invest', type: 'percent', value: 10 }], 'remainder')
    expect(out.goals[0].desired).toBe(60)
    expect(out.goals[0].allocated).toBe(60)
    expect(out.guilt_free).toBe(540)
  })

  it('goals exceed remaining are scaled', () => {
    const out = allocatePaycheck(500, [{ name: 'Rent', amount: 200 }], [{ name: 'A', type: 'fixed', value: 200 }, { name: 'B', type: 'fixed', value: 200 }])
    const allocatedTotal = out.goals.reduce((s: number, g: any) => s + g.allocated, 0)
    expect(allocatedTotal).toBe(300)
    expect(out.guilt_free).toBe(0)
  })

  it('negative paycheck throws', () => {
    expect(() => allocatePaycheck(-100, [], [])).toThrow()
  })
})
