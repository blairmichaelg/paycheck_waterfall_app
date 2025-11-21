import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { toHaveNoViolations } from 'jest-axe'

// Extend expect with testing-library matchers
expect.extend(matchers as any)

// Extend expect with jest-axe accessibility matchers
expect.extend(toHaveNoViolations)
