import React from 'react'
import { allocatePaycheck } from '../lib/allocations'
import type { Bill, Goal } from '../lib/types'

export default function Header({ lastPaycheck = 0, bills = [], goals = [] }: { lastPaycheck?: number; bills?: Bill[]; goals?: Goal[] }) {
  const result = allocatePaycheck(lastPaycheck, bills, goals, 'gross')
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h2 style={{ margin: 0 }}>Paycheck Waterfall</h2>
      <div>
        <div style={{ fontSize: 12, color: '#666' }}>Guilt-free</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>${result.guilt_free.toFixed(2)}</div>
      </div>
    </header>
  )
}
