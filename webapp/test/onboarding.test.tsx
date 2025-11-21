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

    // Bills section should start expanded, so we can add directly
    fireEvent.click(screen.getByText('+ Add bill'))
    const billInputs = screen.getAllByPlaceholderText('name')
    const nameInput = billInputs[0]
    const amountInput = screen.getAllByPlaceholderText('amount')[0]
    fireEvent.change(nameInput, { target: { value: 'Rent' } })
    fireEvent.change(amountInput, { target: { value: '1200' } })

    // Expand goals section to add a goal
    const goalsHeader = screen.getByText(/🎯 Goals/)
    fireEvent.click(goalsHeader)

    fireEvent.click(screen.getByText('+ Add goal'))
    const goalInputs = screen.getAllByPlaceholderText('name')
    const goalName = goalInputs[1] // Second name input (first is bill, second is goal)
    const goalValue = screen.getByPlaceholderText('value')
    fireEvent.change(goalName, { target: { value: 'Invest' } })
    fireEvent.change(goalValue, { target: { value: '10' } })

    // save
    fireEvent.click(screen.getByText(/Save Configuration/))
    expect(onSave).toHaveBeenCalled()
  })
})
