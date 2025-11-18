import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Dashboard from '../src/components/Dashboard'

describe('Dashboard', () => {
  it('runs allocation when I Got Paid clicked', () => {
    const config = { bills: [{ name: 'Rent', amount: 1000 }], goals: [] }
    render(<Dashboard config={config} />)
    const input = screen.getByPlaceholderText('Paycheck amount') as HTMLInputElement
    fireEvent.change(input, { target: { value: '1500' } })
    fireEvent.click(screen.getByText('I Got Paid'))
    expect(screen.getByText('Allocation Result')).toBeInTheDocument()
  })
})
