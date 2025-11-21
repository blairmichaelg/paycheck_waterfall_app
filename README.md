# PayFlow 💰

**Your guilt-free spending companion** – Stop worrying about every purchase. PayFlow tells you exactly how much you can spend without missing rent, bills, or savings goals.

Perfect for anyone living paycheck-to-paycheck who wants simple, stress-free money management.

🌐 **[Try it now →](https://blairmichaelg.github.io/paycheck_waterfall_app/)** | 100% free, no sign-up, runs in your browser

## 💡 Why PayFlow?

Most budgeting apps are overwhelming. They want you to categorize every transaction, set up complex envelopes, and track everything perfectly. But if you're living paycheck-to-paycheck, you don't need all that—you just need to know:

**"Can I afford this coffee without missing rent?"**

PayFlow answers that question in seconds. Enter your paycheck, add your bills and goals, and instantly see your **guilt-free spending amount**. That's it.

## ✨ Features

### Core Experience
- **🎯 Guilt-free spending focus**: See at a glance how much you can spend without worry
- **📊 Smart allocation**: Cadence-aware bills with due date priority, paycheck variance cushioning, and bonus income modeling
- **🔄 One-time bills**: Track non-recurring expenses like car repairs or medical bills (always allocated in full)
- **💡 Transparent breakdown**: Clear waterfall calculation showing exactly where your money goes
- **🌊 Visual waterfall**: Beautiful bucket-filling visualization showing bills and goals progress

### UX & Design
- **🎨 Modern UI**: Vibrant gradients, smooth animations, dark mode, and fully responsive mobile design
- **� Mobile-first**: Optimized layouts and touch targets for small screens (PWA-ready)
- **🔔 Smart notifications**: Toast alerts for auto-adjusted paycheck ranges and important updates
- **💪 Positive messaging**: Encouraging language when money is tight—no guilt, just facts

### Tech & Privacy
- **🌐 PWA Support**: Install on your phone, works offline with service worker caching
- **� Local-first**: All data stays in your browser with localStorage persistence and automatic schema migrations
- **📤 Import/Export**: Back up and restore your configuration as JSON with timestamp-based filenames
- **♿ Accessible**: WCAG 2.1 AA compliant with keyboard navigation, ARIA labels, and screen reader support
- **🧪 Well-tested**: 127+ tests covering allocation logic, UI components, and data persistence
- **🔒 Privacy-first**: No tracking, no ads, no account required—your financial data never leaves your device

## 💰 Financial Precision

PayFlow uses standard JavaScript floating-point arithmetic, which is suitable for personal budgeting and typical paycheck amounts. For amounts under $100,000/month, cumulative rounding errors are negligible (<$0.01).

**Perfect for:**
- Personal budgeting and household finances
- Small business payroll
- Standard consumer finance tracking

**Not recommended for:**
- High-frequency trading or scientific calculations
- Legal/tax calculations with regulatory precision requirements

## Repository Layout

- `webapp/` – Vite + React TypeScript single-page app containing the full experience.
- `docs/` – Architecture documentation and archives.
- `.github/workflows/` – CI definitions for the webapp pipeline.

## Quick Start

### Webapp (current product)
```powershell
cd webapp
npm ci
npm run dev
```

Run tests:
```powershell
cd webapp
npm run test
```

## Contribution Flow

1. Read `docs/ARCHITECTURE.md` for context on goals and near-term roadmap.
2. Follow the environment setup in `CONTRIBUTING.md`.
3. Ensure `npm run lint`, `npm run test`, and `npm run build` pass locally before opening a PR.

## 🚀 Deployment

PayFlow is automatically deployed to GitHub Pages on every push to `main`:

- **Live URL:** https://blairmichaelg.github.io/paycheck_waterfall_app/
- **CI/CD:** GitHub Actions (runs tests, lints, builds, and deploys)
- **Deploy time:** ~2 minutes from push to live
- **Cost:** $0 forever (GitHub Pages free tier)

See `.github/workflows/deploy-gh-pages.yml` for the full deployment pipeline.

## Roadmap Snapshot

- ✅ Validate allocation math and import/export flows fully client-side
- ✅ Harden UI/UX, add schema validation, and automate CI
- ✅ Publish the final web app (deployed on GitHub Pages)
- ✅ Complete comprehensive code review improvements (transparency, simplicity, positivity, mobile-first)
- ✅ Progressive Web App (PWA) support with offline functionality
- ✅ One-time bill frequency for non-recurring expenses
- ✅ Enhanced calculation breakdown with transparent math visualization

## 💬 Feedback & Support

**Found a bug? Have a feature request?**
- � [Open an issue](https://github.com/blairmichaelg/paycheck_waterfall_app/issues) on GitHub
- 💻 Pull Requests: Always welcome!

**Love PayFlow?** Share it with someone who could use guilt-free spending in their life. That's the best support you can give!

---

Made with ❤️ for people living paycheck-to-paycheck. You deserve financial peace, not just spreadsheets.
