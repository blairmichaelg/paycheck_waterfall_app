# Paycheck Waterfall Webapp (MVP)

This folder contains a client-side React + TypeScript webapp (Vite) for the Paycheck Waterfall MVP. It ports the allocation logic from the Python package so the entire product can run client-side using `localStorage` for persistence.

Quick start (requires Node.js and npm):

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

Notes:
- The allocation logic is implemented in `src/lib/allocations.ts` and unit-tested with `vitest` in `test/allocations.test.ts`.
- For MVP, the UI is minimal (demo) and will be expanded to include onboarding, settings, and `I Got Paid` flow.

Import / export
- Use the Export button in the app sidebar to download your configuration as JSON.
- Use the Import file input to load a previously exported JSON config.
