# Contributing

## Developer Setup

Prerequisites:
- Node.js (v18+)
- npm

```powershell
cd webapp
npm ci
npm run dev
```

## Tests

Run the full test suite:

```powershell
cd webapp
npm run test
```

## Coding Conventions

- **TypeScript**: Strict mode is enabled. No `any`.
- **Formatting**: Prettier is enforced. Run `npm run format`.
- **Testing**: Vitest for unit tests, Playwright for E2E.

## Working with GitHub

- Use `gh` CLI to create PRs: `gh pr create`.
