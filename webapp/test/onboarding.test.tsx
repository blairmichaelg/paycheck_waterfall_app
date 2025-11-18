import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Onboarding from '../src/components/Onboarding'

describe('Onboarding', () => {
  it('allows adding and removing bills and goals and saving', () => {
    const initial = { bills: [], goals: [] }
    const onSave = vi.fn()
    render(<Onboarding initial={initial} onSave={onSave} />)

    // add bill
    fireEvent.click(screen.getByText('Add bill'))
    const nameInput = screen.getAllByPlaceholderText('name')[0]
    const amountInput = screen.getAllByPlaceholderText('amount')[0]
    fireEvent.change(nameInput, { target: { value: 'Rent' } })
    fireEvent.change(amountInput, { target: { value: '1200' } })

    // add goal
    fireEvent.click(screen.getByText('Add goal'))
    const goalName = screen.getAllByPlaceholderText('name')[1]
    const goalValue = screen.getAllByPlaceholderText('value')[0]
    fireEvent.change(goalName, { target: { value: 'Invest' } })
    fireEvent.change(goalValue, { target: { value: '10' } })

    // save
    fireEvent.click(screen.getByText('Save configuration'))
    expect(onSave).toHaveBeenCalled()
  })
})
