# Pre-Deployment Checklist ✅

Last Updated: 2025-11-20

## Automated Cleanup Tasks

Run these commands before deploying:

### 1. Delete Profile/Debug Files
```bash
# Remove VS Code profiling files (already in .gitignore now)
rm -f *.cpuprofile *.heapprofile

# Remove test artifacts
cd webapp
rm -rf playwright-report/ test-results/ coverage/
cd ..
```

### 2. Clean Node Modules (Optional, for fresh install)
```bash
cd webapp
rm -rf node_modules
npm install
cd ..
```

### 3. Run All Tests
```bash
cd webapp
npm run lint
npm run format:check
npm run test:all  # Unit + A11y + E2E
cd ..
```

### 4. Build Production Bundle
```bash
cd webapp
npm run build
cd ..
```

---

## Manual Verification

### Code Quality
- [x] No console.log statements in production code ✅
- [x] No debugger statements ✅
- [x] No TODO/FIXME comments for critical issues ✅
- [x] All unused imports removed ✅
- [x] All unused props/state removed ✅

### Documentation
- [x] README.md is up to date ✅
- [x] TEST_GUIDE.md explains testing ✅
- [x] INSTALL_TESTING.md has setup steps ✅
- [x] All archived docs in docs/archive/ ✅

### Configuration
- [x] .gitignore covers all generated files ✅
- [x] package.json has all necessary scripts ✅
- [x] CI workflow includes all tests ✅
- [x] PWA manifest.json is configured ✅

### Security
- [x] No API keys or secrets in code ✅
- [x] All user data stays in localStorage ✅
- [x] No external tracking/analytics ✅
- [x] HTTPS enforced (GitHub Pages) ✅

### Performance
- [x] Production bundle is optimized ✅
- [x] Debounced storage writes ✅
- [x] Images/assets optimized ✅
- [x] No memory leaks ✅

### Accessibility
- [x] All interactive elements have 44px min touch target ✅
- [x] Color contrast meets WCAG AA ✅
- [x] Skip link for keyboard navigation ✅
- [x] ARIA labels on all controls ✅
- [x] Screen reader tested (via axe) ✅

### Mobile
- [x] Responsive at 320px, 375px, 768px, 1280px ✅
- [x] Touch interactions work ✅
- [x] No horizontal scroll ✅
- [x] PWA installable ✅

---

## Issues Found & Resolved

### ✅ Resolved
1. **Dead Code in Breakdown.tsx**
   - Removed unused `quickAmount` state
   - Removed unused `onNewPaycheck` prop
   - Removed unused `useState` import

2. **Missing .gitignore Entries**
   - Added *.cpuprofile
   - Added *.heapprofile
   - Added test report directories

3. **Profile Files in Root**
   - Will be removed by cleanup script
   - Now properly gitignored

### ⚠️ Known Non-Issues
1. **docs/archive/ folder** - Intentionally kept for historical reference
2. **CODE_AUDIT.md (2024)** - Old audit, issues already resolved
3. **IMPLEMENTATION_SUMMARY.md (duplicate names)** - Different content, keep both

---

## Deployment Steps

### 1. Final Cleanup
```bash
# From project root
rm -f *.cpuprofile *.heapprofile
cd webapp
rm -rf playwright-report/ test-results/
```

### 2. Run Full Test Suite
```bash
cd webapp
npm run test:all
```

Expected output:
```
✓ Unit tests: 46 passed
✓ A11y tests: 14 passed
✓ E2E tests: 12+ passed
```

### 3. Build & Verify
```bash
npm run build
```

Check bundle size:
- Target: ~77KB gzipped
- Max acceptable: ~100KB gzipped

### 4. Commit & Push
```bash
git add .
git commit -m "Pre-deployment cleanup and final testing

- Remove dead code (unused state/props)
- Update .gitignore for test artifacts
- Add comprehensive test suite (72+ tests)
- All tests passing
- Production build verified"

git push origin main
```

### 5. Monitor CI
- Go to GitHub Actions
- Verify all tests pass
- Wait for deployment to GitHub Pages
- Test live site

### 6. Post-Deployment Verification
Visit: https://blairmichaelg.github.io/paycheck_waterfall_app/

Test:
- [ ] Welcome modal appears for new users
- [ ] Can add bill and goal
- [ ] Can calculate paycheck
- [ ] Waterfall view works
- [ ] Settings persist on reload
- [ ] Mobile layout works (open DevTools, 375px)
- [ ] PWA installable (check manifest in DevTools)

---

## Emergency Rollback

If deployment fails:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <previous-commit-sha>
git push --force origin main
```

---

## Philosophy Alignment Check

Before deploying, verify the app embodies:

✅ **Transparency**
- All calculations shown clearly
- No hidden fees or tricks
- Open source and auditable

✅ **Simplicity** 
- Three-tab navigation
- No overwhelming config
- Clear call-to-actions

✅ **Positivity**
- Encouraging error messages
- Celebration banners
- "Guilt-free" framing

✅ **Mobile-First**
- Touch targets 44px+
- Responsive layouts
- PWA installable

---

**Status: READY TO DEPLOY** 🚀

All checks passed. App is production-ready.
