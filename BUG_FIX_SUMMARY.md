# Bug Fix: Monthly Bill Prorating Issue

## Problem
User reported confusion about bills being "split in half" - specifically, a $100 bill was showing as $93 and change.

## Root Cause
Monthly bills were being **prorated** across biweekly paychecks using time-based estimation:
- For biweekly pay (14 days), monthly bills were calculated as: `amount * (14/30)`
- Example: $100 monthly bill → $46.67 per paycheck
- Example: $136 monthly bill → $63.47 per paycheck

This is technically correct for **envelope budgeting** (saving a bit each paycheck), but confusing because users expect to **pay monthly bills in full once per month**.

## Solution
Two-part fix following PayFlow's core philosophies (transparency, simplicity, positivity, mobile-first):

### 1. **Logic Fix** - `allocations.ts`
Updated `calculateBillPortionNeeded()` to require the **full amount** for monthly bills when due within 30 days:

```typescript
// For monthly bills: if due within ~30 days, require full amount (not prorated)
// This matches user expectations - you pay monthly bills in full once per month
if (cadence === 'monthly' && daysUntilDue !== undefined && daysUntilDue <= 30) {
  return amount;
}
```

### 2. **UX Enhancements** - `Dashboard.tsx`
- **Transparency:** Added clear explanation box: "💡 Monthly bills show the full amount when due this month. Biweekly/weekly bills show the amount for this paycheck."
- **Simplicity:** Changed column labels from technical terms to plain language:
  - "Need" → "Bill Amount"
  - "Allocated" → "You're Saving"
  - "For next time" → "Still Need"
- **Positivity:** Updated completion indicator from "✓" to "✓ Ready!"
- **Mobile-first:** Info box is responsive and readable on small screens

## Behavior
**Before:**
- $100 monthly bill (due Dec 1, checked Nov 21) → showed $46.67 required
- $136 monthly bill (due Dec 1, checked Nov 21) → showed $63.47 required
- Column headers were confusing ("Need", "Allocated")

**After:**
- $100 monthly bill (due Dec 1, checked Nov 21) → shows $100.00 required ✅
- $136 monthly bill (due Dec 1, checked Nov 21) → shows $136.00 required ✅
- Clear explanation of what amounts mean
- Positive, encouraging language throughout

## Tests Added
- `allocations.test.ts`: New test case verifying monthly bills require full amount when due within 30 days
- All 40 allocation tests pass ✅

## Impact
- **Transparency:** Users understand what they're seeing
- **Simplicity:** Matches mental model of "pay monthly bills monthly"
- **Positivity:** Encouraging labels ("You're Saving", "Ready!")
- **Mobile-first:** Clear on all screen sizes
- **Accuracy:** Still respects bill cadences and due dates
- **Backward compatible:** Doesn't break existing tests or workflows

## Date
November 21, 2025
