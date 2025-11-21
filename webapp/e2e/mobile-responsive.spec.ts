/**
 * E2E Test: Mobile Responsiveness
 * Tests mobile-first design with touch interactions and responsive layouts.
 * 
 * Philosophy: Mobile-First - app works beautifully on small screens
 */

import { test, expect } from '@playwright/test';

test.describe('Mobile Responsive Design', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('should display mobile-optimized layout', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss welcome modal
    const welcomeButton = page.locator('button:has-text("Explore on My Own")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // Check mobile tab labels (shorter)
    await expect(page.locator('button:has-text("💰 Got Paid")')).toBeVisible();
    await expect(page.locator('button:has-text("⚙️ Settings")')).toBeVisible();

    // Sidebar should not be visible on mobile
    await expect(page.locator('aside')).not.toBeVisible();
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss welcome modal
    const welcomeButton = page.locator('button:has-text("Explore on My Own")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // Tap "I Got Paid" tab
    await page.tap('button:has-text("💰 Got Paid")');
    await expect(page.locator('text=Paycheck Amount')).toBeVisible();

    // Tap input field - should scroll into view
    const input = page.locator('input[placeholder="e.g. 850"]');
    await input.tap();
    
    // Input should be focused
    await expect(input).toBeFocused();

    // Type amount
    await input.fill('1500');

    // Tap calculate button
    await page.tap('button:has-text("🎉 Got Paid!")');

    // Should show results (even without bills/goals)
    await expect(page.locator('text=Your Guilt-Free Spending')).toBeVisible();
  });

  test('should rotate from portrait to landscape', async ({ page, context }) => {
    await page.goto('/');
    
    // Dismiss welcome modal
    const welcomeButton = page.locator('button:has-text("Explore on My Own")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('button:has-text("💰 Got Paid")')).toBeVisible();

    // Rotate to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    
    // Content should still be visible and responsive
    await expect(page.locator('button:has-text("I Got Paid")')).toBeVisible();
    
    // Rotate back to portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('button:has-text("💰 Got Paid")')).toBeVisible();
  });

  test('should handle small viewport (iPhone SE)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    
    // Dismiss welcome modal
    const welcomeButton = page.locator('button:has-text("Explore on My Own")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // All essential UI should be visible
    await expect(page.locator('button:has-text("💰 Got Paid")')).toBeVisible();
    await expect(page.locator('button:has-text("⚙️ Settings")')).toBeVisible();
    
    // Input should be accessible
    await page.click('button:has-text("💰 Got Paid")');
    const input = page.locator('input[placeholder="e.g. 850"]');
    await expect(input).toBeVisible();
    
    // Should be able to type
    await input.fill('1000');
    await expect(input).toHaveValue('1000');
  });
});

test.describe('Tablet Layout', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad size

  test('should show desktop-style layout at tablet size', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss welcome modal
    const welcomeButton = page.locator('button:has-text("Explore on My Own")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // Should show full tab labels (desktop mode)
    await expect(page.locator('button:has-text("💰 I Got Paid")')).toBeVisible();
    await expect(page.locator('button:has-text("⚙️ Plan & Settings")')).toBeVisible();

    // Sidebar should be visible
    await page.click('button:has-text("Plan & Settings")');
    await expect(page.locator('text=Data Management')).toBeVisible();
  });
});
