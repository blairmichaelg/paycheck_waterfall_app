# Architecture Overview

## Goals
- Give people a lightweight "paycheck waterfall" calculator that can run entirely on-device.
- Keep the allocation logic deterministic and easy to port between runtimes (Python package ↔ web client).
- Enable future multi-surface experiences (CLI, native app, hosted API) without rewriting core business rules.

## Current State (MVP)
The project currently ships only a Vite + React TypeScript webapp (`webapp/`).

Key traits:
- **All client-side**: persistence is browser `localStorage`; no backend calls.
- **Single-page layout**: `App.tsx` renders `Header`, `Onboarding`, and `Dashboard` plus import/export utilities.
- **Allocation logic**: implemented in `webapp/src/lib/allocations.ts` and mirrored in tests under `webapp/test/`.
- **CI**: GitHub Actions workflow (`.github/workflows/webapp-ci.yml`) runs install → test → build for the webapp.

The Python package directory (`src/paycheck_waterfall`) is intentionally empty for now; it will house the shared logic once we are ready to ship a CLI or API.

## Frontend Architecture
```
App
├── Header                // Paycheck summary
├── Onboarding            // Collect bills, goals, paycheck prefs
│   ├── local state hands config to parent
│   └── uses storage helpers for defaults
└── Dashboard             // Visualizes allocation results
```

Supporting modules:
- `webapp/src/lib/storage.ts` – thin wrapper around `localStorage` with load/save/export/import helpers.
- `webapp/src/lib/types.ts` – TypeScript types for `Bill`, `Goal`, `UserConfig`.
- `webapp/src/lib/allocations.ts` – deterministic allocator used by both UI and tests.

Styling is currently inline (per-component) with a single global stylesheet for base fonts.

## Data Flow & Persistence
1. When the app loads, `loadConfig()` pulls serialized JSON from `localStorage` (or falls back to defaults).
2. `Onboarding` emits updated configs to `App`, which immediately calls `saveConfig()` to persist to `localStorage`.
3. `Dashboard` recomputes allocation breakdowns using the shared `allocatePaycheck` helper.
4. Import/export flows serialize the full config to disk for manual backup/restore.

No schema validation is performed yet. A future refactor will introduce Zod/TypeScript schemas and versioned migrations so storage can evolve safely.

## Testing Strategy
- **Unit tests** (`webapp/test/allocations.test.ts`): cover bill/goal logic, edge cases, and error handling.
- **Component tests** (`webapp/test/*.test.tsx`): exercise Dashboard and Onboarding happy paths via Testing Library.
- Vitest is configured with jsdom and a shared setup file for DOM shims.

Additional tests (state persistence, import/export, visual regression) are planned alongside broader coverage reporting.

## Planned Backend Expansion
Future milestones call for a Python package that:
1. Re-implements the allocator in Python for CLI/API parity.
2. Exposes a FastAPI (or similar) service so the webapp can optionally sync configs via authenticated requests.
3. Shares fixtures/tests with the webapp through JSON contracts to guarantee identical math.

Until that work begins, the Python directories are placeholders. Contributors should focus on the frontend and keep the business logic isolated so it can be lifted into Python later.
