import React, { useState } from 'react'
import type { UserConfig, Bill, Goal } from '../lib/types'

export default function Onboarding({ initial, onSave }: { initial: UserConfig; onSave: (c: UserConfig) => void }) {
  const [bills, setBills] = useState<Bill[]>(initial.bills)
  const [goals, setGoals] = useState<Goal[]>(initial.goals)
  const [error, setError] = useState<string | null>(null)

  const addBill = () => setBills([...bills, { name: '', amount: 0 }])
  const addGoal = () => setGoals([...goals, { name: '', type: 'percent', value: 0 }])

  const removeBill = (i: number) => setBills(bills.filter((_, idx) => idx !== i))
  const removeGoal = (i: number) => setGoals(goals.filter((_, idx) => idx !== i))

  const save = () => {
    // basic validation
    for (const b of bills) {
      if (!b.name || b.name.trim() === '') {
        setError('All bills must have a name')
        return
      }
      if (Number.isNaN(Number(b.amount)) || b.amount < 0) {
        setError('Bill amounts must be non-negative numbers')
        return
      }
    }
    for (const g of goals) {
      if (!g.name || g.name.trim() === '') {
        setError('All goals must have a name')
        return
      }
      if (Number.isNaN(Number(g.value)) || g.value < 0) {
        setError('Goal values must be non-negative numbers')
        return
      }
    }
    setError(null)
    onSave({ bills, goals })
  }

  return (
    <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <h3>Quick setup</h3>
      {error ? <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div> : null}
      <div>
        <h4>Bills</h4>
        {bills.map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input placeholder="name" value={b.name} onChange={(e) => { const next = [...bills]; next[i].name = e.target.value; setBills(next) }} />
            <input type="number" placeholder="amount" value={String(b.amount)} onChange={(e) => { const next = [...bills]; next[i].amount = Number(e.target.value); setBills(next) }} />
            <button onClick={() => removeBill(i)} aria-label={`remove-bill-${i}`}>Remove</button>
          </div>
        ))}
        <button onClick={addBill}>Add bill</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>Goals</h4>
        {goals.map((g, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input placeholder="name" value={g.name} onChange={(e) => { const next = [...goals]; next[i].name = e.target.value; setGoals(next) }} />
            <select value={g.type} onChange={(e) => { const next = [...goals]; next[i].type = e.target.value as any; setGoals(next) }}>
              <option value="percent">percent</option>
              <option value="fixed">fixed</option>
            </select>
            <input type="number" placeholder="value" value={String(g.value)} onChange={(e) => { const next = [...goals]; next[i].value = Number(e.target.value); setGoals(next) }} />
            <button onClick={() => removeGoal(i)} aria-label={`remove-goal-${i}`}>Remove</button>
          </div>
        ))}
        <button onClick={addGoal}>Add goal</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={save}>Save configuration</button>
      </div>
    </div>
  )
}
