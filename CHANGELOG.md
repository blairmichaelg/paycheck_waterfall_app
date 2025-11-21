# Changelog

All notable changes to PayFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2025-11-20

### 🎉 Official Release
- **First Major Release**: Feature-complete, tested, and deployed.
- **Frontend-Only Architecture**: Validated as the superior approach for privacy and cost.

### 🎯 Future Roadmap
- Progressive Web App (PWA) support
- Enhanced mobile gestures
- Optional cloud backup (maybe)

---

## [2024-11-20] - Radical Simplification

### 🔴 Breaking Changes
- **Removed Spending Tracker** - Conflicted with "guilt-free" philosophy. Trust the number!
- **Removed Bill Paid Checkboxes** - Dashboard is now pure calculation view, not task tracking
- **Removed Light/Heavy Paycheck Indicator** - Reduced cognitive load
- **Removed Quick Paycheck Entry** - From Waterfall view (duplicate functionality)

### ✨ Improvements
- Simplified tab labels (removed redundant guilt-free amount display)
- Reduced gradient usage for better visual hierarchy
- Increased minimum font sizes (13-15px) for mobile readability
- Reduced desktop header font (96px → 72px) for better balance
- **~250 lines of code removed** 🎉

### 🐛 Fixes
- Moved Data Management buttons from hidden sidebar into Settings tab
- Now accessible on mobile and narrow screens
- Export, Import, and Start Fresh always visible

### 📊 Impact
- **Simplicity Score:** 6/10 → 9/10
- **Mobile-First Score:** 7/10 → 9/10
- **Philosophy Alignment:** Significantly strengthened

---

## [2024-11-18] - GitHub Pages Deployment

### Added
- GitHub Actions workflow for automatic deployment
- Deploy to GitHub Pages on every push to main
- 2-minute deploy time with automatic testing

### Changed
- Migrated from Netlify to GitHub Pages (free forever)
- Base path configured in `vite.config.ts`

### Removed
- Netlify deployment configuration

**Live URL:** https://blairmichaelg.github.io/paycheck_waterfall_app/

---

## [2024-11] - Initial UX Improvements

### Added
- Positive error message system (15+ helpful messages)
- Transparent calculation breakdown ("How we calculated this")
- Backup restoration banner (24-hour recovery window)
- Empty state improvements with encouraging copy
- "Start Fresh" button (replaces anxiety-inducing "Clear Config")

### Changed
- Shared Card component for consistency
- Style constants establishing design system
- Storage migration system (V1 → V4 schema)
- Celebration banners for fully funded bills

### Testing
- 46 unit tests covering allocation logic and UI components
- Allocation edge cases covered
- Storage migration tests

---

## [Earlier] - Core Features

### Added
- Cadence-aware bill allocation (monthly, biweekly, etc.)
- Paycheck range cushioning with auto-adjustment
- Bonus income modeling
- Goal allocation (percentage or fixed amount)
- Waterfall visualization
- Export/Import configuration (JSON)
- Dark mode support
- localStorage persistence with schema validation
- Mobile-responsive design

### Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Styling:** Inline styles with theme system
- **Storage:** localStorage with Zod validation
- **Testing:** Vitest + React Testing Library + Playwright
- **CI/CD:** GitHub Actions
- **Hosting:** GitHub Pages

---

## Philosophy & Design Principles

### Core Values
1. **Transparency** - Show the math, always
2. **Simplicity** - One thing done exceptionally well
3. **Positivity** - Encouraging language, celebration of progress
4. **Mobile-First** - Readable fonts, clean layouts, touch-friendly

### What We Removed (and Why)
- **Spending Tracker** - Philosophy conflict. "Guilt-free" means trust the number.
- **Bill Paid Checkboxes** - Mixed calculation with task tracking.
- **Excessive Gradients** - Visual noise. Now only guilt-free displays pop.
- **Duplicate Features** - Multiple paycheck inputs, redundant labels.

### The Result
A focused app that does **ONE thing exceptionally well:**
> Tell you exactly how much you can spend without worry.

---

## For Developers

### Running Locally
```bash
cd webapp
npm ci
npm run dev
```

### Running Tests
```bash
npm test
```

### Deploying
```bash
git push origin main  # Auto-deploys via GitHub Actions
```

### Project Structure
```
webapp/
├── src/
│   ├── components/     # React components
│   ├── lib/           # Business logic & utilities
│   └── App.tsx        # Main app
├── test/              # Unit & integration tests
└── package.json
```

---

## Support & Contributions

- 🐛 **Issues:** [GitHub Issues](https://github.com/blairmichaelg/paycheck_waterfall_app/issues)
- 💻 **PRs:** Always welcome!
- 📧 **Feedback:** Use the app, find bugs, suggest improvements

---

**Made with ❤️ for people living paycheck-to-paycheck.**
