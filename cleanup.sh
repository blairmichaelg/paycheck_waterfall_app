#!/bin/bash

# Pre-Deployment Cleanup Script
# Removes temporary files and test artifacts

echo "🧹 Starting cleanup..."

# Remove profile files
echo "Removing profile files..."
rm -f *.cpuprofile *.heapprofile 2>/dev/null
echo "✓ Profile files removed"

# Remove test artifacts
echo "Removing test artifacts..."
cd webapp
rm -rf playwright-report/ test-results/ coverage/ 2>/dev/null
echo "✓ Test artifacts removed"

# Optional: Clean node_modules (uncomment if needed)
# echo "Cleaning node_modules..."
# rm -rf node_modules
# npm install
# echo "✓ Node modules reinstalled"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Run: cd webapp && npm run test:all"
echo "2. Run: npm run build"
echo "3. Commit and push"
