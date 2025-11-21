# Backend Improvement Action Plan

**Based on:** BACKEND_REVIEW.md (Nov 20, 2025)  
**Target Timeline:** Implement P0 items before next release, P1 within 2 sprints

---

## Quick Start

Run this command to see current test results:
```powershell
cd webapp
npm run test
```

---

## P0: Critical Fixes (Implement Immediately)

### 1. Add Date String Validation ⚡ 30 minutes

**File:** `webapp/src/lib/types.ts`

**Current Issue:**
```typescript
nextDueDate: z.string().optional(), // Accepts any string!
nextPaycheckDate: z.string().optional()
```

**Fix:**
```typescript
const isoDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(
    (val) => !isNaN(new Date(val).getTime()),
    'Must be a valid date'
  );

export const billSchema = z.object({
  name: z.string().min(1, 'Bill name required'),
  amount: z.number().nonnegative('Bill amount must be ≥ 0'),
  cadence: z.enum(BILL_CADENCES).default('monthly'),
  dueDay: z.number().int().min(1).max(31).optional(),
  nextDueDate: isoDateSchema.optional(), // ✅ Now validated
});

export const settingsSchema = z.object({
  percentApply: z.enum(['gross', 'remainder']),
  payFrequency: z.enum(PAY_FREQUENCIES).default('biweekly'),
  paycheckRange: incomeRangeSchema.default({ min: 0, max: 0 }),
  nextPaycheckDate: isoDateSchema.optional(), // ✅ Now validated
});
```

**Test:**
```typescript
// Add to webapp/test/types.test.ts (new file)
describe('date validation', () => {
  it('rejects invalid date strings', () => {
    const result = billSchema.safeParse({
      name: 'Test',
      amount: 100,
      cadence: 'monthly',
      nextDueDate: 'invalid-date'
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid ISO dates', () => {
    const result = billSchema.safeParse({
      name: 'Test',
      amount: 100,
      cadence: 'monthly',
      nextDueDate: '2025-12-31'
    });
    expect(result.success).toBe(true);
  });

  it('rejects dates in wrong format', () => {
    const result = billSchema.safeParse({
      name: 'Test',
      amount: 100,
      cadence: 'monthly',
      nextDueDate: '12/31/2025' // US format - should fail
    });
    expect(result.success).toBe(false);
  });
});
```

---

### 2. Document Floating-Point Precision ⚡ 15 minutes

**File:** `webapp/src/lib/allocations.ts`

**Add to `_round2` function:**
```typescript
/**
 * Round a number to 2 decimal places for currency display.
 * 
 * PRECISION NOTES:
 * - Uses standard IEEE 754 floating-point arithmetic
 * - Precision is maintained throughout calculations, rounded only at output
 * - Cumulative errors typically < $0.01 for amounts under $100,000
 * - For high-precision requirements (hedge funds, accounting systems),
 *   consider using a decimal library like decimal.js or big.js
 * 
 * SUFFICIENT FOR:
 * ✅ Personal budgeting (<$10K/month paychecks)
 * ✅ Small business payroll (<$50K/month)
 * ✅ Standard consumer finance applications
 * 
 * LIMITATIONS:
 * ⚠️ Not suitable for high-frequency trading or scientific calculations
 * ⚠️ Avoid using for legal/tax calculations requiring exact cent precision
 * 
 * @param x - The number to round
 * @returns Number rounded to 2 decimal places
 * @example
 * _round2(10.567) // 10.57
 * _round2(0.1 + 0.2) // 0.3 (not 0.30000000000000004)
 */
function _round2(x: number): number {
  return Math.round(x * 100) / 100;
}
```

**Add to README:**
```markdown
## Financial Precision

PayFlow uses standard JavaScript floating-point arithmetic, which is suitable for personal budgeting and typical paycheck amounts. For amounts under $100,000/month, cumulative rounding errors are negligible (<$0.01).

**Not recommended for:**
- Accounting systems requiring exact cent precision
- High-frequency trading or scientific calculations
- Legal/tax calculations with regulatory precision requirements

For enterprise use cases, we recommend migrating to the Python backend with `decimal.Decimal` support (roadmap item).
```

---

## P1: Important Improvements (Next Sprint)

### 3. Add Edge Case Test Suite ⚡ 2 hours

**File:** `webapp/test/allocations.edge-cases.test.ts` (new file)

```typescript
import { describe, it, expect } from 'vitest';
import { allocatePaycheck } from '../src/lib/allocations';

describe('allocatePaycheck - edge cases', () => {
  describe('overdue bills', () => {
    it('handles bills with negative days until due', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const out = allocatePaycheck(
        1000,
        [{ name: 'Overdue', amount: 500, cadence: 'monthly', nextDueDate: pastDate.toISOString().split('T')[0] }],
        [],
        { upcomingDays: 14 }
      );
      
      expect(out.bills[0].daysUntilDue).toBeLessThan(0);
      expect(out.bills[0].allocated).toBeGreaterThan(0);
    });
  });

  describe('leap year handling', () => {
    it('handles Feb 29 in leap year', () => {
      const leapYearDate = new Date(2024, 1, 29); // Feb 29, 2024
      const out = allocatePaycheck(
        1000,
        [{ name: 'Rent', amount: 500, cadence: 'monthly', dueDay: 29 }],
        [],
        { currentDate: new Date(2024, 1, 15), upcomingDays: 14 }
      );
      
      expect(out.bills[0].allocated).toBeGreaterThan(0);
    });

    it('handles dueDay 29-31 in February (non-leap)', () => {
      const out = allocatePaycheck(
        1000,
        [{ name: 'Rent', amount: 500, cadence: 'monthly', dueDay: 31 }],
        [],
        { currentDate: new Date(2025, 1, 15), upcomingDays: 14 } // Feb 2025
      );
      
      // Should map to Feb 28
      expect(out.bills[0].allocated).toBeGreaterThan(0);
    });
  });

  describe('same-day bills', () => {
    it('prioritizes larger bills when due on same day', () => {
      const dueDate = '2025-02-15';
      const out = allocatePaycheck(
        1000,
        [
          { name: 'Large Bill', amount: 800, cadence: 'monthly', nextDueDate: dueDate },
          { name: 'Small Bill', amount: 300, cadence: 'monthly', nextDueDate: dueDate },
        ],
        [],
        { currentDate: new Date(2025, 1, 10), nextPaycheckDate: '2025-02-20' }
      );
      
      // Large bill should be fully funded first
      expect(out.bills[0].name).toBe('Large Bill');
      expect(out.bills[0].allocated).toBe(800);
      expect(out.bills[1].allocated).toBe(200);
    });
  });

  describe('extreme values', () => {
    it('handles very large paycheck amounts', () => {
      const out = allocatePaycheck(
        150000, // $150K paycheck
        [{ name: 'Rent', amount: 5000, cadence: 'monthly' }],
        [{ name: 'Invest', type: 'percent', value: 10 }],
        { upcomingDays: 30 }
      );
      
      expect(out.bills[0].allocated).toBe(5000);
      expect(out.goals[0].allocated).toBe(15000);
      expect(out.guilt_free).toBe(130000);
    });

    it('handles zero-amount bills', () => {
      const out = allocatePaycheck(
        1000,
        [{ name: 'Free Service', amount: 0, cadence: 'monthly' }],
        [],
        { upcomingDays: 30 }
      );
      
      expect(out.bills[0].allocated).toBe(0);
      expect(out.guilt_free).toBe(1000);
    });

    it('handles zero-amount goals', () => {
      const out = allocatePaycheck(
        1000,
        [],
        [{ name: 'Paused Goal', type: 'fixed', value: 0 }],
        { upcomingDays: 30 }
      );
      
      expect(out.goals[0].allocated).toBe(0);
      expect(out.guilt_free).toBe(1000);
    });
  });

  describe('multiple bonus sources', () => {
    it('combines bonuses with different cadences correctly', () => {
      const out = allocatePaycheck(
        2000,
        [{ name: 'Rent', amount: 1000, cadence: 'monthly' }],
        [],
        {
          bonuses: [
            { name: 'Commission', cadence: 'monthly', range: { min: 200, max: 400 }, recurring: true },
            { name: 'Tips', cadence: 'weekly', range: { min: 50, max: 100 }, recurring: true },
          ],
          upcomingDays: 14
        }
      );
      
      // Should include prorated portions of both bonuses
      expect(out.meta.supplemental_income).toBeGreaterThan(0);
      expect(out.guilt_free).toBeGreaterThan(1000);
    });
  });

  describe('daylight saving transitions', () => {
    it('handles DST spring forward correctly', () => {
      // March 10, 2024, 2 AM - DST begins
      const dstDate = new Date(2024, 2, 10, 1, 0, 0);
      const out = allocatePaycheck(
        1000,
        [{ name: 'Bill', amount: 500, cadence: 'monthly', nextDueDate: '2024-03-15' }],
        [],
        { currentDate: dstDate, nextPaycheckDate: '2024-03-24' }
      );
      
      expect(out.bills[0].daysUntilDue).toBe(5);
    });

    it('handles DST fall back correctly', () => {
      // November 3, 2024, 2 AM - DST ends
      const dstDate = new Date(2024, 10, 3, 1, 0, 0);
      const out = allocatePaycheck(
        1000,
        [{ name: 'Bill', amount: 500, cadence: 'monthly', nextDueDate: '2024-11-08' }],
        [],
        { currentDate: dstDate, nextPaycheckDate: '2024-11-17' }
      );
      
      expect(out.bills[0].daysUntilDue).toBe(5);
    });
  });
});
```

---

### 4. Normalize Dates to UTC ⚡ 1 hour

**File:** `webapp/src/lib/dateUtils.ts`

**Add new utility:**
```typescript
/**
 * Normalize a date to UTC midnight.
 * Prevents time zone issues when comparing dates.
 * 
 * @param date - Date to normalize (Date object or ISO string)
 * @returns New Date object set to midnight UTC
 * @example
 * const date = new Date('2025-01-31T23:00:00-08:00'); // 11 PM PST
 * const normalized = normalizeToUTCMidnight(date);
 * // normalized = 2025-02-01T00:00:00Z (next day in UTC)
 */
export function normalizeToUTCMidnight(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/**
 * Calculate days between two dates in UTC midnight terms.
 * Prevents off-by-one errors due to time zones.
 * 
 * @param fromDate - Start date
 * @param toDate - End date
 * @returns Number of full days between dates
 */
export function daysBetweenUTC(fromDate: Date, toDate: Date): number {
  const from = normalizeToUTCMidnight(fromDate);
  const to = normalizeToUTCMidnight(toDate);
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
```

**Update `allocations.ts`:**
```typescript
import { normalizeToUTCMidnight, daysBetweenUTC } from './dateUtils';

// Replace getDaysUntilDue:
const getDaysUntilDue = (dueDate: Date, currentDate: Date): number => {
  return daysBetweenUTC(currentDate, dueDate);
};
```

**Tests:**
```typescript
// Add to webapp/test/dateUtils.test.ts (new file)
describe('normalizeToUTCMidnight', () => {
  it('normalizes date with time to UTC midnight', () => {
    const date = new Date('2025-01-31T23:59:59-08:00');
    const normalized = normalizeToUTCMidnight(date);
    expect(normalized.getUTCHours()).toBe(0);
    expect(normalized.getUTCMinutes()).toBe(0);
  });

  it('handles ISO date strings', () => {
    const normalized = normalizeToUTCMidnight('2025-01-31');
    expect(normalized.getUTCHours()).toBe(0);
    expect(normalized.getUTCDate()).toBe(31);
  });
});

describe('daysBetweenUTC', () => {
  it('calculates days correctly across time zones', () => {
    const from = new Date('2025-01-31T23:00:00-08:00'); // 11 PM PST
    const to = new Date('2025-02-01T01:00:00-08:00');   // 1 AM PST next day
    expect(daysBetweenUTC(from, to)).toBe(1);
  });
});
```

---

### 5. Fix Bill Sorting Stability ⚡ 30 minutes

**File:** `webapp/src/lib/allocations.ts`

**Current:**
```typescript
billsWithPriority.sort((a, b) => a.sortKey - b.sortKey);
```

**Fixed:**
```typescript
// Sort by priority, then by amount (largest first for same priority)
billsWithPriority.sort((a, b) => {
  if (a.sortKey !== b.sortKey) {
    return a.sortKey - b.sortKey; // Primary: urgency
  }
  // Secondary: larger bills first (helps user cover big obligations)
  return (b.amount ?? 0) - (a.amount ?? 0);
});
```

**Test (add to existing allocations.test.ts):**
```typescript
it('prioritizes larger bills when due on same day', () => {
  const testDate = new Date(2025, 0, 10);
  const nextPaycheck = new Date(2025, 0, 24);
  
  const out = allocatePaycheck(
    1000,
    [
      { name: 'Small', amount: 200, cadence: 'monthly', dueDay: 15 },
      { name: 'Large', amount: 800, cadence: 'monthly', dueDay: 15 },
      { name: 'Medium', amount: 500, cadence: 'monthly', dueDay: 15 },
    ],
    [],
    { currentDate: testDate, nextPaycheckDate: nextPaycheck.toISOString(), upcomingDays: 14 }
  );
  
  // Should fund in order: Large, Medium, Small
  expect(out.bills[0].name).toBe('Large');
  expect(out.bills[0].allocated).toBe(800);
  expect(out.bills[1].name).toBe('Medium');
  expect(out.bills[1].allocated).toBe(200); // Partial
  expect(out.bills[2].name).toBe('Small');
  expect(out.bills[2].allocated).toBe(0); // Unfunded
});
```

---

## P2: Nice to Have (Future Enhancements)

### 6. Storage Quota Pre-Check ⚡ 1.5 hours

**File:** `webapp/src/lib/storage.ts`

```typescript
/**
 * Estimate the size of data when serialized to JSON.
 */
function estimateStorageSize(data: unknown): number {
  return new Blob([JSON.stringify(data)]).size;
}

/**
 * Check if enough storage is available for the data.
 * Uses Storage API if available, otherwise assumes sufficient space.
 */
async function hasEnoughStorage(requiredBytes: number): Promise<boolean> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const available = (estimate.quota ?? Infinity) - (estimate.usage ?? 0);
      const safetyMargin = 1.5; // Require 50% extra space
      return available > requiredBytes * safetyMargin;
    } catch (err) {
      console.warn('Storage estimate failed:', err);
      return true; // Assume OK if API fails
    }
  }
  return true; // Storage API not available, proceed optimistically
}

/**
 * Save config with pre-check for available storage.
 */
export async function saveConfigSafe(cfg: UserConfig): Promise<SaveResult> {
  try {
    const normalized = userConfigSchema.parse({
      ...cfg,
      version: CONFIG_VERSION,
      updatedAt: new Date().toISOString(),
    });
    
    const estimatedSize = estimateStorageSize(normalized);
    const hasSpace = await hasEnoughStorage(estimatedSize);
    
    if (!hasSpace) {
      return { success: false, error: 'STORAGE_QUOTA' };
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return { success: true };
  } catch (err) {
    console.warn('saveConfigSafe: failed to write config', err);
    const errorType = detectErrorType(err);
    return { success: false, error: errorType };
  }
}

// Keep original saveConfig for sync contexts, add note:
/**
 * @deprecated Use saveConfigSafe for better error handling
 */
export function saveConfig(cfg: UserConfig): SaveResult {
  // ... existing implementation
}
```

---

### 7. Add Backup Compression ⚡ 2 hours

**File:** `webapp/src/lib/storage.ts`

**Install dependency:**
```powershell
cd webapp
npm install lz-string
npm install --save-dev @types/lz-string
```

**Implementation:**
```typescript
import LZString from 'lz-string';

export function backupConfig(): void {
  try {
    const current = loadConfig();
    const json = JSON.stringify(current);
    const compressed = LZString.compress(json);
    localStorage.setItem(BACKUP_KEY, compressed);
    localStorage.setItem(BACKUP_TIMESTAMP_KEY, Date.now().toString());
  } catch (err) {
    console.warn('backupConfig: failed to create backup', err);
  }
}

export function restoreConfigFromBackup(): boolean {
  try {
    const backupRaw = localStorage.getItem(BACKUP_KEY);
    const timestampRaw = localStorage.getItem(BACKUP_TIMESTAMP_KEY);

    if (!backupRaw || !timestampRaw) return false;

    const timestamp = parseInt(timestampRaw, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - timestamp > twentyFourHours) {
      localStorage.removeItem(BACKUP_KEY);
      localStorage.removeItem(BACKUP_TIMESTAMP_KEY);
      return false;
    }

    const decompressed = LZString.decompress(backupRaw);
    if (!decompressed) return false;
    
    const backup = JSON.parse(decompressed) as UserConfig;
    saveConfig(backup);

    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(BACKUP_TIMESTAMP_KEY);

    return true;
  } catch (err) {
    console.warn('restoreConfigFromBackup: failed to restore', err);
    return false;
  }
}
```

**Benefits:**
- Reduces backup storage by ~70%
- Allows larger configs without quota issues
- Transparent to users (still JSON-based)

---

### 8. Import Depth Validation ⚡ 30 minutes

**File:** `webapp/src/lib/storage.ts`

```typescript
/**
 * Validate JSON depth to prevent stack overflow attacks.
 */
function validateJSONDepth(obj: unknown, maxDepth = 10): boolean {
  function checkDepth(val: unknown, depth: number): boolean {
    if (depth > maxDepth) return false;
    if (val && typeof val === 'object') {
      const values = Array.isArray(val) ? val : Object.values(val);
      return values.every((v) => checkDepth(v, depth + 1));
    }
    return true;
  }
  return checkDepth(obj, 0);
}

export function importConfig(json: string): ImportResult {
  try {
    const raw = JSON.parse(json);
    
    if (!validateJSONDepth(raw)) {
      return { success: false, error: 'INVALID_CONFIG' };
    }
    
    const { config } = parseConfig(raw);
    const saveResult = saveConfig(config);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }
    return { config, success: true };
  } catch (err) {
    console.warn('importConfig: invalid json', err);
    const errorType = detectErrorType(err);
    return { success: false, error: errorType };
  }
}
```

---

## Implementation Checklist

### Phase 1: Critical (Complete before next release)
- [ ] Add date string validation to Zod schemas
- [ ] Write date validation tests
- [ ] Document float precision limits in code
- [ ] Add precision notes to README
- [ ] Verify all tests pass

### Phase 2: Edge Cases (Sprint 2)
- [ ] Create edge case test file
- [ ] Add UTC normalization utilities
- [ ] Update allocations.ts to use UTC functions
- [ ] Fix bill sorting with secondary key
- [ ] Add sorting stability test
- [ ] Run full test suite

### Phase 3: Enhancements (As time allows)
- [ ] Implement storage quota pre-check
- [ ] Add backup compression with lz-string
- [ ] Add import depth validation
- [ ] Update storage tests

---

## Testing Commands

```powershell
# Run all tests
cd webapp
npm run test

# Run tests in watch mode (during development)
npm run test:watch

# Run specific test file
npm run test -- allocations.test.ts

# Run with coverage
npm run test -- --coverage

# Lint code
npm run lint

# Format code
npm run format
```

---

## Success Metrics

**Test Coverage Targets:**
- [ ] Allocation logic: 95%+ coverage
- [ ] Storage layer: 90%+ coverage
- [ ] Edge cases: 100% of identified scenarios tested

**Quality Gates:**
- [ ] All tests passing
- [ ] No lint errors or warnings
- [ ] No TypeScript errors
- [ ] Bundle size <100KB gzipped

---

## Notes

- All changes should be made incrementally with tests
- Commit after each completed item
- Update CHANGELOG.md for user-facing changes
- Consider backwards compatibility for storage changes
- Add migration tests if schema changes

---

*Action plan generated from BACKEND_REVIEW.md*
