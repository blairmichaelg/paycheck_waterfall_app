import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Dashboard from '../src/components/Dashboard'
import type { UserConfig } from '../src/lib/types'

describe('Dashboard', () => {
  it('runs allocation when I Got Paid clicked', async () => {
    const config: UserConfig = {
      version: 3,
      updatedAt: new Date().toISOString(),
      bills: [{ name: 'Rent', amount: 1000, cadence: 'monthly' as const }],
      goals: [],
      bonuses: [],
      settings: {
        percentApply: 'gross' as const,
        payFrequency: 'biweekly' as const,
        paycheckRange: { min: 0, max: 0 }
      }
    }
    render(<Dashboard config={config} theme="light" />)
    const input = screen.getByPlaceholderText('e.g. 850')
    fireEvent.change(input, { target: { value: '2000' } })
    fireEvent.click(screen.getByRole('button', { name: /I Got Paid/ }))

    // Wait for async calculation to complete
    await waitFor(() => {
      expect(screen.getByText(/Your Guilt-Free Spending/)).toBeInTheDocument()
    })

    expect(screen.getByText(/Bills Funded This Paycheck/)).toBeInTheDocument()
    expect(screen.getByText(/Percent goals use:/)).toBeInTheDocument()
  })
})
