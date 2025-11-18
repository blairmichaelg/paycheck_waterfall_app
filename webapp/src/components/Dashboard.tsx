import React, { useState } from 'react'
import { allocatePaycheck } from '../lib/allocations'
import type { UserConfig } from '../lib/types'

export default function Dashboard({ config }: { config: UserConfig }) {
  const [lastResult, setLastResult] = useState<any | null>(null)
  const [amount, setAmount] = useState<number>(0)

  const run = () => {
    const res = allocatePaycheck(amount, config.bills, config.goals, 'gross')
    setLastResult(res)
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Paycheck amount" />
        <button onClick={run}>I Got Paid</button>
      </div>

      {lastResult ? (
        <div style={{ marginTop: 12 }}>
          <h4>Allocation Result</h4>
          <pre>{JSON.stringify(lastResult, null, 2)}</pre>
        </div>
      ) : (
        <div style={{ marginTop: 12, color: '#666' }}>Enter a paycheck amount and click "I Got Paid" to see allocations.</div>
      )}
    </div>
  )
}
