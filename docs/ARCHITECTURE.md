# PayFlow Architecture

## Project Philosophy

PayFlow does **ONE thing exceptionally well:**
> Tell you exactly how much you can spend without worry.

**Core Values:**
1. **Transparency** - Show the math, always
2. **Simplicity** - Focus over feature bloat
3. **Positivity** - Encouraging, guilt-free language
4. **Mobile-First** - Small screens are primary

## Current State (Production)

**Live:** https://blairmichaelg.github.io/paycheck_waterfall_app/
**Hosting:** GitHub Pages (auto-deploy on push to main)
**Status:** Stable, 2-person app with top-quality UX

### Tech Stack
```
Frontend:  React + TypeScript + Vite
Styling:   Inline styles + theme system (no CSS frameworks)
Storage:   localStorage with Zod validation (V4 schema)
Testing:   Vitest + React Testing Library + Playwright (209 test cases)
CI/CD:     GitHub Actions → GitHub Pages (~2min deploys)
```

### Key Features
- ✅ Cadence-aware bill allocation (monthly, biweekly, etc.)
- ✅ Paycheck range cushioning with auto-adjustment
- ✅ Bonus income modeling
- ✅ Goal allocation (percentage or fixed amount)
- ✅ Waterfall visualization
- ✅ Export/Import configuration (JSON)
- ✅ Dark mode support
- ✅ Mobile-optimized (16px fonts, 44px touch targets)
- ✅ Backup/restore (24-hour recovery window)

## Frontend Architecture

### Component Structure
```
App.tsx (Main Shell)
├── Header              // Big guilt-free number display
├── Tab Navigation      // Got Paid | Waterfall | Settings
├── Dashboard           // Paycheck input → calculation → results
├── Breakdown           // Waterfall visualization
└── Onboarding          // Bills, goals, settings configuration
    └── Data Management // Export, Import, Start Fresh
```

### Key Modules
```
lib/
├── allocations.ts      // Core math (bills → goals → guilt-free)
├── storage.ts          // localStorage with schema validation
├── types.ts            // TypeScript types (Bill, Goal, UserConfig)
├── theme.ts            // Color system (light/dark mode)
├── errorMessages.ts    // Positive, helpful error messages
├── dateUtils.ts        // Date calculations for bill cadences
└── formatters.ts       // Currency and date formatting
```

### Styling Approach
- **Inline styles** - No CSS-in-JS library, direct style objects
- **Theme system** - `getThemeColors()` provides light/dark palettes
- **Responsive** - `isMobile` state triggers layout changes at 768px
- **No frameworks** - Pure React, no Tailwind/Bootstrap/MUI

## Data Flow & Persistence

### Storage Schema (V4)
```typescript
{
  version: 4,
  bills: Bill[],           // name, amount, cadence, dueDay
  goals: Goal[],           // name, type (percent/fixed), value
  bonuses: BonusIncome[],  // name, amount, cadence, min/max range
  settings: {
    payFrequency,          // weekly, biweekly, semi_monthly, monthly
    paycheckRange,         // { min, max } for cushioning
    percentApply,          // gross or remainder
    nextPaycheckDate,      // optional future date
  }
}
```

### Flow
1. **Load:** `loadConfig()` reads localStorage, validates with Zod, migrates old schemas
2. **Calculate:** User enters paycheck → `allocatePaycheck()` → guilt-free amount
3. **Save:** Changes auto-save to localStorage via `saveConfig()`
4. **Backup:** Before "Start Fresh", config saved to `payflow_config_backup` (24hr TTL)
5. **Export/Import:** JSON file download/upload for manual backup

### Schema Migrations
- V1→V2: Added paycheck range
- V2→V3: Added bonus income
- V3→V4: Added bill paid tracking
- All migrations tested and validated

## Testing Strategy

### Test Coverage (46 tests)
```
webapp/test/
├── allocations.test.ts           // Core allocation logic
├── allocations.edge-cases.test.ts // Edge cases, rounding
├── dashboard.test.tsx             // Paycheck input, results
├── onboarding.test.tsx            // Bill/goal configuration
├── storage.test.ts                // localStorage, migrations
├── storage.edge-cases.test.ts     // Corruption, invalid data
├── bill-cadence.test.ts           // Cadence calculations
├── theme.test.ts                  // Dark/light mode
└── error-messages.test.ts         // Error handling
```

### CI Pipeline
```yaml
On push to main:
1. npm ci               # Clean install
2. npm run lint         # ESLint + TypeScript
3. npm test             # 46 unit tests
4. npm run build        # Production build
5. Deploy to GH Pages   # ~2 minute total
```

### Test Philosophy
- **Fast** - All tests run in <5 seconds
- **Deterministic** - No flaky tests, no network calls
- **Edge cases** - Rounding, invalid inputs, schema migrations
- **Component isolation** - Testing Library for UI

## Development Workflow

### Local Development
```bash
cd webapp
npm ci                  # Install dependencies
npm run dev             # Start dev server (localhost:5173)
npm test                # Run tests
npm run build           # Production build
```

### File Organization
```
webapp/
├── src/
│   ├── components/     # React UI components
│   │   ├── Dashboard.tsx
│   │   ├── Breakdown.tsx
│   │   ├── Onboarding.tsx
│   │   ├── Header.tsx
│   │   └── ConfirmModal.tsx
│   ├── lib/           # Business logic & utilities
│   │   ├── allocations.ts
│   │   ├── storage.ts
│   │   ├── types.ts
│   │   ├── theme.ts
│   │   └── errorMessages.ts
│   ├── App.tsx        # Main shell
│   └── main.tsx       # Entry point
├── test/              # Unit & component tests
└── package.json
```

### Code Style
- **TypeScript strict mode** - No `any`, explicit types
- **React hooks** - Functional components, no classes
- **Inline styles** - No CSS files (except base styles.css)
- **Positive language** - Error messages are helpful, not scary
- **Mobile-first** - Design for small screens, enhance for large

---

## Roadmap

### ✅ Completed (2024)
- Core allocation logic with cadence awareness
- Mobile-optimized UI (16px fonts, 44px touch targets)
- Dark mode support
- Export/Import configuration
- Schema validation and migrations
- GitHub Pages deployment
- 46 unit tests with CI/CD
- **Radical simplification** (removed spending tracker, bill checkboxes)

### 🎯 Next Priorities
1. **PWA Support** - Add manifest.json for home screen install
2. **Keyboard Shortcuts** - Alt+1/2/3 to switch tabs
3. **Paycheck History** - Simple log of past calculations

### 🔮 Future Possibilities
- **Python Package** - Extract allocation logic for CLI/API use
- **REST API** - Optional backend for cloud sync
- **Multi-device Sync** - Encrypted cloud storage
- **Bill Reminders** - Native notifications (if PWA)

### ❌ Not Planned
- Spending tracker (removed - philosophy conflict)
- Bill paid tracking in Dashboard (mixed concerns)
- Enterprise features (auth, teams, permissions)
- Mobile apps (PWA is sufficient)

---

## Design Decisions

### Why No CSS Framework?
- **Simplicity** - One less dependency
- **Control** - Exact styling we want
- **Performance** - No unused CSS
- **Mobile-first** - Easier to optimize for small screens

### Why localStorage (No Backend)?
- **Privacy** - Data never leaves device
- **Speed** - Instant load times
- **Simplicity** - No server costs or complexity
- **Reliability** - Works offline

### Why Inline Styles?
- **Colocation** - Component logic and styling together
- **Type safety** - TypeScript catches style errors
- **Dynamic theming** - Easy light/dark mode
- **No naming** - No BEM, no CSS modules, no conflicts

### Why Remove Features?
> "Perfection is achieved not when there is nothing more to add,
> but when there is nothing left to take away." – Antoine de Saint-Exupéry

We removed ~250 lines of code (spending tracker, bill checkboxes, etc.) because:
1. **Philosophy alignment** - "Guilt-free" means trusting the number
2. **Simplicity** - Each feature adds cognitive load
3. **Focus** - One thing done exceptionally well

---

## Contributing

### Getting Started
1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Add tests
5. Open a PR

### Guidelines
- Follow existing code style
- Add tests for new features
- Keep changes focused and small
- Use positive, helpful language in UI
- Test on mobile (real device if possible)

### Questions?
- Open an issue
- Check existing docs
- Ask in PR comments
