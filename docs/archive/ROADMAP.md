# Paycheck Waterfall App – Roadmap

## Project Naming Ideas

Consider these alternative names that better convey the positive, guilt-free spending focus:

1. **PayFlow** – Simple, modern, conveys the waterfall/flow concept
2. **Guilt-Free Pay** – Direct focus on the core benefit
3. **Paycheck Planner** – Clear, straightforward utility
4. **MoneyFlow** – Broader appeal, natural flow metaphor
5. **PayBalance** – Emphasizes the balancing/allocation aspect
6. **SpendSmart** – Action-oriented, positive framing
7. **Clarity Pay** – Emphasizes transparency and understanding
8. **FlowPay** – Short, modern, memorable

**Recommendation:** Consider "PayFlow" or "Clarity Pay" for a clean, positive brand that emphasizes the flow/clarity benefit over the technical "waterfall" term.

---

## Current Status (v3)

### ✅ Completed
- **Core allocation logic**: Cadence-aware bills, paycheck range cushioning, bonus income modeling
- **Configuration schema**: v3 with bills, goals, bonuses, settings (payFrequency, paycheckRange, percentApply)
- **Storage & migration**: localStorage persistence with Zod validation and legacy config upgrade
- **Multi-view UI**: "I Got Paid" spending view + "Plan & Settings" configuration view
- **Design system**: CSS tokens, responsive layouts, positive-first guilt-free display
- **Toast feedback**: Inline save confirmations and status updates
- **Tests**: Unit tests for allocator, Dashboard, Onboarding components
- **CI/CD**: GitHub Actions for lint, test, build on push/PR

### 🚧 In Progress
- **Observability hooks**: Environment variable support for analytics/tracking (VITE_ENABLE_OBSERVABILITY, VITE_ANALYTICS_URL)

---

## Near-Term Roadmap

### P0 – Critical Path
1. **Enhanced variance modeling** *(optional enhancement)*
   - Allow users to input historical paycheck data for automatic range calculation
   - Surface "worst case" vs "expected case" allocations side-by-side

2. **Undo/redo for destructive actions**
   - Replace window.confirm dialogs with in-app modals showing what will be deleted
   - Implement undo buffer for clear/import operations (toast with "Undo" action)

3. **Bill due-date awareness**
   - Use `dueDay` field to show which bills are coming up in the next paycheck period
   - Highlight bills that need funding urgently vs those that can wait

### P1 – High Value
4. **Mobile-first responsive design**
   - Optimize layouts for mobile screens (currently desktop-focused)
   - Touch-friendly input controls and button sizing

5. **Dark mode support**
   - Add theme toggle and dark color palette
   - Persist theme preference in localStorage

6. **Export/import improvements**
   - Add CSV export for bills/goals for external analysis
   - Import from common budgeting app formats (YNAB, Mint)

7. **Quick-add templates**
   - Pre-populate common bills (rent, utilities, subscriptions) with suggested cadences
   - Save user's own templates for rapid setup

### P2 – Nice to Have
8. **Paycheck history tracking**
   - Store past allocations to show spending trends over time
   - Visualize guilt-free spending across paychecks (chart)

9. **Goal progress tracking**
   - Show cumulative progress toward fixed goals (e.g., "Emergency Fund: $2,400 / $10,000")
   - Celebrate milestones with positive feedback

10. **Shareable configs**
    - Generate a shareable link/code for your config (obfuscated, no PII)
    - Useful for the "user + friend" audience

---

## Technical Debt & Maintenance

- **TypeScript version**: Using TypeScript 5.4.0 (stable version)
- **Dependency updates**: Regular npm audit and minor version bumps
- **Test coverage**: Add integration tests for full user flows (onboarding → allocation → export)
- **Accessibility audit**: Ensure ARIA labels, keyboard navigation, screen reader support
- **Performance**: Consider memoization for allocation calculations if config grows large

---

## Long-Term Vision

- **Multi-currency support**: For international users
- **Shared household budgets**: Multiple users contributing to the same config
- **Smart suggestions**: ML-based recommendations for bill cadences or goal amounts based on patterns
- **Mobile app**: Native iOS/Android companion (React Native or PWA)
- **Integrations**: Connect to bank APIs for automatic paycheck detection

---

## Observability & Analytics (Optional)

If `VITE_ENABLE_OBSERVABILITY=true`:
- Track anonymized usage metrics (# of bills, goals, allocations run)
- Capture client-side errors for debugging
- Measure key user flows (time to first allocation, save frequency)

**Privacy-first approach**: No PII, no tracking without explicit opt-in, all data stays local unless user enables observability.

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on proposing new features, filing issues, and submitting PRs.
