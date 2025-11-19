# PayFlow (Paycheck Waterfall App)

**Your guilt-free spending companion** – Personal cashflow planning via a "paycheck waterfall" model. The repository currently ships a browser-only MVP with a modern, positive-first UI while laying the groundwork for a reusable allocation engine that can later power a Python CLI or hosted API.

## ✨ Features

- **🎯 Guilt-free spending focus**: See at a glance how much you can spend without worry
- **📊 Smart allocation**: Cadence-aware bills with due date priority, paycheck variance cushioning, and bonus income modeling
- **🎨 Modern UI**: Vibrant gradients, smooth animations, dark mode, and fully responsive mobile design
- **💾 Local-first**: All data stays in your browser with localStorage persistence and automatic schema migrations
- **📤 Import/Export**: Back up and restore your configuration as JSON with timestamp-based filenames
- **♿ Accessible**: WCAG 2.1 AA compliant with keyboard navigation, ARIA labels, and screen reader support
- **🧪 Well-tested**: Comprehensive test suite covering allocation logic, UI components, and data persistence

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

## Roadmap Snapshot

- Validate allocation math and import/export flows fully client-side.
- Harden UI/UX, add schema validation, and automate CI (see GitHub Projects).
- Port allocator into Python + expose a FastAPI service for optional syncing.
