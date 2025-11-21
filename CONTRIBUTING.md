# Contributing to PayFlow

Thank you for considering contributing to PayFlow! This guide will help you get started.

## 🎯 Philosophy

Before contributing, please understand PayFlow's core principles:

1. **Transparency** - Show the math, always
2. **Simplicity** - One thing done exceptionally well
3. **Positivity** - Encouraging language, celebration of progress
4. **Mobile-First** - Small screens are the priority

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)
- Git

### Local Development
```bash
# Clone the repository
git clone https://github.com/blairmichaelg/paycheck_waterfall_app.git
cd paycheck_waterfall_app/webapp

# Install dependencies
npm ci

# Start dev server
npm run dev
```

Visit `http://localhost:5173/paycheck_waterfall_app/` in your browser.

## 🧪 Testing

### Run All Tests
```bash
cd webapp
npm run test              # Unit tests (watch mode)
npm run test:e2e          # E2E tests with Playwright
npm run test:a11y         # Accessibility tests
npm run test:all          # Everything (CI-style)
```

### Before Submitting a PR
```bash
npm run lint              # ESLint checks
npm run format:check      # Prettier checks
npm run build             # Production build test
```

## 📝 Coding Standards

### TypeScript
- **Strict mode** is enabled - no `any` types
- Use explicit return types for public functions
- Prefer type inference for local variables

### Code Style
- **Prettier** handles formatting (enforced in CI)
- Run `npm run format` before committing
- Use **functional components** with hooks
- Prefer **composition** over inheritance

### Testing
- **Unit tests** for business logic (`lib/`)
- **Component tests** for UI behavior
- **E2E tests** for critical user flows
- Maintain **100% coverage** for allocation logic

### Accessibility
- All interactive elements need `aria-label` or text
- Maintain **WCAG 2.1 AA** compliance
- Ensure **44px minimum touch targets**
- Test with keyboard navigation

## 🌿 Git Workflow

### Branch Naming
- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code improvements

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add one-time bill frequency option
fix: correct monthly bill allocation logic
docs: update README with PWA instructions
refactor: extract useConfigIO hook
```

### Pull Requests
1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Ensure all tests pass locally
4. Push and create a PR on GitHub
5. Wait for CI checks to pass
6. Request review from maintainers

Using GitHub CLI:
```bash
gh pr create --title "feat: your feature" --body "Description"
```

## 🐛 Reporting Issues

**Before opening an issue:**
1. Check existing issues for duplicates
2. Try the latest version at [live site](https://blairmichaelg.github.io/paycheck_waterfall_app/)
3. Clear browser cache and localStorage

**When reporting:**
- Describe what you expected vs what happened
- Include steps to reproduce
- Mention browser/device (if UI bug)
- Share error messages or screenshots

## 💡 Feature Requests

We welcome ideas! But remember:
- PayFlow is **intentionally simple** - less is more
- New features must align with our 4 core philosophies
- Consider if the feature serves the 2-person user base

## 📂 Project Structure

```
webapp/
├── src/
│   ├── components/        # React components
│   ├── lib/
│   │   ├── allocations.ts # Core allocation logic
│   │   ├── storage.ts     # localStorage + migrations
│   │   ├── types.ts       # Type definitions
│   │   └── ...
│   ├── App.tsx           # Main app shell
│   └── main.tsx          # Entry point + PWA registration
├── test/                 # Tests mirror src/ structure
├── public/               # Static assets (manifest, SW)
└── package.json
```

## 🎨 UI Development Tips

- All colors come from `theme.ts` - don't hardcode colors
- Use `useIsMobile()` hook for responsive layouts
- Test on actual mobile devices when possible
- Gradients are reserved for **guilt-free amount only**

## 🚢 Deployment

Deployment is automatic:
- Push to `main` triggers GitHub Actions
- Runs tests, lints, builds, and deploys
- Live in ~2 minutes at GitHub Pages

## 📞 Questions?

- 💬 Open a [Discussion](https://github.com/blairmichaelg/paycheck_waterfall_app/discussions)
- 🐛 Report bugs via [Issues](https://github.com/blairmichaelg/paycheck_waterfall_app/issues)

---

**Thank you for helping make financial peace accessible!** ❤️
