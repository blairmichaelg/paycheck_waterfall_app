# Testing Guide 🧪

Comprehensive automated testing for PayFlow, aligned with our core philosophies.

## Philosophy Alignment

| Test Type | Transparency | Simplicity | Positivity | Mobile-First |
|-----------|-------------|-----------|-----------|--------------|
| **Unit Tests** | ✅ Logic is correct | ✅ Catches bugs early | ✅ Confidence to ship | ➖ |
| **A11y Tests** | ✅ Everyone can read UI | ➖ | ✅ Inclusive | ✅ Screen readers |
| **E2E Tests** | ✅ Documents user flows | ✅ Integration works | ✅ No regressions | ✅ Mobile viewports |

---

## Test Suite Overview

### ✅ Unit Tests (46 tests)
- **Location:** `test/*.test.ts`
- **Coverage:** Allocation logic, edge cases, utilities
- **Run:** `npm test`

### ♿ Accessibility Tests (14 tests)
- **Location:** `test/a11y/*.test.tsx`
- **Coverage:** WCAG 2.1 AA compliance, color contrast, ARIA
- **Run:** `npm run test:a11y`

### 🎭 E2E Tests (12+ scenarios)
- **Location:** `e2e/*.spec.ts`
- **Coverage:** User journeys, mobile, keyboard navigation
- **Run:** `npm run test:e2e`

---

## Quick Start

### 1. Install Dependencies

```bash
cd webapp
npm install
npx playwright install --with-deps chromium webkit
```

### 2. Run All Tests

```bash
# Run everything at once
npm run test:all

# Or run individually
npm test                 # Unit tests only
npm run test:a11y        # Accessibility tests
npm run test:e2e         # E2E tests
npm run test:e2e:ui      # E2E with visual UI
```

### 3. Development Workflow

```bash
# Watch mode for unit tests during development
npm run test:watch

# Run E2E tests in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific E2E test file
npm run test:e2e -- user-journey
```

---

## Test Categories

### 📋 Unit Tests

**What they test:**
- Allocation algorithm correctness
- Edge cases (leap years, DST, overdue bills)
- Floating-point precision
- Date calculations

**Example:**
```typescript
test('handles bills with negative days until due', () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5);
  
  const result = allocatePaycheck(1000, [{
    name: 'Overdue',
    amount: 500,
    cadence: 'monthly',
    nextDueDate: pastDate.toISOString().split('T')[0]
  }], [], { upcomingDays: 14 });
  
  expect(result.bills[0].daysUntilDue).toBeLessThan(0);
  expect(result.bills[0].allocated).toBeGreaterThan(0);
});
```

---

### ♿ Accessibility Tests

**What they test:**
- WCAG 2.1 AA compliance
- Color contrast ratios (4.5:1 for normal text)
- ARIA attributes
- Semantic HTML
- Keyboard navigation support

**Example:**
```typescript
test('should have no accessibility violations (light theme)', async () => {
  const { container } = render(<Dashboard config={mockConfig} theme="light" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Checked violations:**
- `color-contrast` - Text readable by vision-impaired users
- `aria-allowed-attr` - Proper ARIA usage
- `button-name` - All buttons have labels
- `label` - Form inputs have associated labels

---

### 🎭 E2E Tests

**What they test:**
- Complete user flows from start to finish
- Mobile responsiveness (375px → 768px → 1280px)
- Keyboard-only navigation
- Settings persistence (export/import/backup)
- Touch interactions

**Key scenarios:**

#### 1. First-Time User Journey (`user-journey.spec.ts`)
```typescript
- Welcome modal → Dismiss
- Add bill (Rent, $1200)
- Add goal (Savings, 10%)
- Enter paycheck ($2000)
- Calculate → See guilt-free amount
- Navigate to waterfall view
```

#### 2. Settings Persistence (`settings-persistence.spec.ts`)
```typescript
- Add bill → Export config → Clear data
- Restore from backup → Verify bill returns
- Reload page → Settings persist
```

#### 3. Mobile Responsive (`mobile-responsive.spec.ts`)
```typescript
- Test at 375px (iPhone SE)
- Test at 768px (iPad)
- Rotate portrait ↔ landscape
- Touch interactions
```

#### 4. Keyboard Navigation (`keyboard-navigation.spec.ts`)
```typescript
- Tab → Skip link appears
- Arrow keys navigate tabs
- Enter submits form
- axe-core checks all views
```

---

## CI/CD Integration

Tests run automatically on every push:

```yaml
# .github/workflows/webapp-ci.yml
1. Lint → Format check
2. Unit tests (46 tests)
3. Accessibility tests (14 tests)
4. E2E tests (12+ scenarios)
5. Build production bundle
6. Deploy to GitHub Pages
```

**On failure:**
- Playwright report uploaded as artifact
- Review screenshots and traces
- Fix → Push → Re-run

---

## Writing New Tests

### Unit Test Template

```typescript
// test/feature.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../src/lib/myModule';

describe('myFunction', () => {
  it('should handle edge case', () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });
});
```

### A11y Test Template

```typescript
// test/a11y/component.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import MyComponent from '../../src/components/MyComponent';

test('should have no violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### E2E Test Template

```typescript
// e2e/feature.spec.ts
import { test, expect } from '@playwright/test';

test('should complete user flow', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Action")');
  await expect(page.locator('text=Result')).toBeVisible();
});
```

---

## Debugging Failed Tests

### Unit Tests
```bash
# Run with verbose output
npm test -- --reporter=verbose

# Run single file
npm test -- allocation.test.ts

# Debug mode
npm test -- --inspect-brk
```

### E2E Tests
```bash
# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run with debug mode
npm run test:e2e -- --debug

# Generate trace
npm run test:e2e -- --trace on

# View trace
npx playwright show-trace trace.zip
```

### Common Issues

**E2E test times out:**
- Check if dev server is running (`npm run dev`)
- Increase timeout in `playwright.config.ts`
- Check network tab for failed requests

**A11y test fails:**
- Run `npm run dev` and inspect with axe DevTools
- Check console for contrast ratio details
- Fix color values in `theme.ts`

**Flaky E2E test:**
- Add `await expect().toBeVisible()` before actions
- Use `page.waitForLoadState('networkidle')`
- Avoid hardcoded waits (`page.waitForTimeout`)

---

## Performance Benchmarks

| Test Type | Count | Duration | Runs On |
|-----------|-------|----------|---------|
| Unit | 46 | ~2s | Every save (watch mode) |
| A11y | 14 | ~5s | Before commit |
| E2E | 12+ | ~45s | Before push |
| **Total** | **72+** | **~52s** | **CI pipeline** |

---

## Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Unit test coverage | ~95% | 90%+ |
| A11y violations | 0 | 0 |
| E2E user flows | 4 core | 5+ |
| Mobile viewports | 3 (375/768/1280) | 3+ |

---

## Philosophy Reminders

When writing tests, remember:

✨ **Transparency** - Tests document expected behavior
- Use descriptive test names
- Add comments explaining edge cases
- Make assertions clear

💚 **Positivity** - Tests give confidence
- Celebrate green builds
- Fix failing tests quickly
- Don't skip tests to make CI pass

📱 **Mobile-First** - Test small screens first
- Start E2E tests with 375px viewport
- Test touch interactions
- Verify responsive layouts

🎯 **Simplicity** - Don't over-test
- Test behavior, not implementation
- One assertion per test when possible
- Avoid brittle selectors

---

## Resources

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [jest-axe Docs](https://github.com/nickcolley/jest-axe)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Contrast Checker Tool](https://webaim.org/resources/contrastchecker/)

---

**Last Updated:** 2025-01-20  
**Maintained By:** @blairmichaelg
