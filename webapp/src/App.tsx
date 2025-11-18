import React from 'react'
import { allocatePaycheck } from './lib/allocations'

export default function App() {
  const demo = allocatePaycheck(
    2000,
    [
      { name: 'Rent', amount: 1200 },
      { name: 'Utilities', amount: 200 }
    ],
    [
      { name: 'Invest', type: 'percent', value: 10 },
      { name: 'Emergency', type: 'fixed', value: 100 }
    ],
    'gross'
  )

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1>Paycheck Waterfall (Demo)</h1>
      <pre>{JSON.stringify(demo, null, 2)}</pre>
    </div>
  )
}
