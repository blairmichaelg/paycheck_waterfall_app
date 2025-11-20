# PayFlow 💰

**Your guilt-free spending companion** – Stop worrying about every purchase. PayFlow tells you exactly how much you can spend without missing rent, bills, or savings goals.

Perfect for anyone living paycheck-to-paycheck who wants simple, stress-free money management.

🌐 **[Try it now →](https://blairmichaelg.github.io/paycheck_waterfall_app/)** | 100% free, no sign-up, runs in your browser

## 💡 Why PayFlow?

Most budgeting apps are overwhelming. They want you to categorize every transaction, set up complex envelopes, and track everything perfectly. But if you're living paycheck-to-paycheck, you don't need all that—you just need to know:

**"Can I afford this coffee without missing rent?"**

PayFlow answers that question in seconds. Enter your paycheck, add your bills and goals, and instantly see your **guilt-free spending amount**. That's it.

## ✨ Features

- **🎯 Guilt-free spending focus**: See at a glance how much you can spend without worry
- **📊 Smart allocation**: Cadence-aware bills with due date priority, paycheck variance cushioning, and bonus income modeling
- **🎨 Modern UI**: Vibrant gradients, smooth animations, dark mode, and fully responsive mobile design
- **💾 Local-first**: All data stays in your browser with localStorage persistence and automatic schema migrations
- **📤 Import/Export**: Back up and restore your configuration as JSON with timestamp-based filenames
- **♿ Accessible**: WCAG 2.1 AA compliant with keyboard navigation, ARIA labels, and screen reader support
- **🧪 Well-tested**: Comprehensive test suite covering allocation logic, UI components, and data persistence
- **🔒 Privacy-first**: No tracking, no ads, no account required—your financial data never leaves your device

## Repository Layout

- `webapp/` – Vite + React TypeScript single-page app containing the full MVP experience.
- `docs/ARCHITECTURE.md` – deeper dive into goals, frontend structure, and future backend plans.
- `src/paycheck_waterfall/` – reserved for the upcoming Python package (empty for now).
- `tests/` – will house Python tests once the shared allocator lands.
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

### Python Package (planned)
The Python workspace is intentionally empty while the allocator is validated in TypeScript. When development begins, follow `CONTRIBUTING.md` to create a virtual environment and install the package in editable mode. Until then, there is no runnable Python artifact.

## Contribution Flow

1. Read `docs/ARCHITECTURE.md` for context on goals and near-term roadmap.
2. Follow the environment setup in `CONTRIBUTING.md` (Node.js + optional Python venv).
3. For frontend work, ensure `npm run lint`, `npm run test`, and `npm run build` pass locally before opening a PR.
4. Prefer keeping business logic isolated in `webapp/src/lib/` so it can be ported to Python later.

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
- ✅ Complete comprehensive code review improvements (transparency, simplicity, positivity)
- 🔜 Extract allocation logic into a shared Python package + REST API backend

## 💬 Feedback & Support

**Found a bug? Have a feature request?**
- 📧 Email: [feedback@payflow.app](mailto:feedback@payflow.app)
- 🐛 GitHub Issues: [Report here](https://github.com/blairmichaelg/paycheck_waterfall_app/issues)
- 💻 Pull Requests: Always welcome!

**Love PayFlow?** Share it with someone who could use guilt-free spending in their life. That's the best support you can give!

---

Made with ❤️ for people living paycheck-to-paycheck. You deserve financial peace, not just spreadsheets.
