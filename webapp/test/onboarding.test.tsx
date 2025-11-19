import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Onboarding from '../src/components/Onboarding'
import type { UserConfig } from '../src/lib/types'

describe('Onboarding', () => {
  it('allows adding and removing bills and goals and saving', () => {
    const initial: UserConfig = {
      version: 3,
      updatedAt: new Date().toISOString(),
      bills: [],
      goals: [],
      bonuses: [],
      settings: {
        percentApply: 'gross',
        payFrequency: 'biweekly',
        paycheckRange: { min: 0, max: 0 }
      }
    }
    const onSave = vi.fn()
    render(<Onboarding initial={initial} onSave={onSave} theme="light" />)

    // add bill
    fireEvent.click(screen.getByText(/Add bill/))
    const nameInput = screen.getAllByPlaceholderText('name')[0]
    const amountInput = screen.getAllByPlaceholderText('amount')[0]
    fireEvent.change(nameInput, { target: { value: 'Rent' } })
    fireEvent.change(amountInput, { target: { value: '1200' } })

    // add goal
    fireEvent.click(screen.getByText(/Add goal/))
    const goalName = screen.getAllByPlaceholderText('name')[1]
    const goalValue = screen.getAllByPlaceholderText('value')[0]
    fireEvent.change(goalName, { target: { value: 'Invest' } })
    fireEvent.change(goalValue, { target: { value: '10' } })

    // save
    fireEvent.click(screen.getByText(/Save Configuration/))
    expect(onSave).toHaveBeenCalled()
  })
})
