/**
 * E2E Test: Keyboard Navigation & Accessibility
 * Tests keyboard-only navigation and screen reader support.
 * 
 * Philosophy: Transparency - everyone can navigate the app
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Keyboard Navigation', () => {
  test('should support full keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss welcome modal with keyboard
    await page.keyboard.press('Tab'); // Focus "Explore on My Own"
    await page.keyboard.press('Tab'); // Focus "Let's Get Started"
    await page.keyboard.press('Enter'); // Click it

    // Tab should focus the first interactive element
    await page.keyboard.press('Tab');
    
    // Should be able to navigate through tabs with arrow keys
    await page.keyboard.press('ArrowRight');
    
    // Verify focus moved
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    expect(focusedElement).toContain('Settings');
  });

  test('should show skip link on first Tab', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss welcome modal
    const welcomeButton = page.locator('button:has-text("Explore on My Own")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // Press Tab - skip link should appear
    await page.keyboard.press('Tab');
    
    // Skip link should be visible when focused
    const skipLink = page.locator('a:has-text("Skip to main content")');
    await expect(skipLink).toBeFocused();
    
    // Press Enter - should jump to main content
    await page.keyboard.press('Enter');
    
    // Main content should be focused
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('should navigate tabs with arrow keys', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss welcome modal
    const welcomeButton = page.locator('button:has-text("Explore on My Own")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // Tab to first tab button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be on "I Got Paid" tab
    await expect(page.locator('button:has-text("I Got Paid")').first()).toBeFocused();
    
    // Arrow right to next tab
    await page.keyboard.press('ArrowRight');
    
    // Should move to next enabled tab
    const focused = await page.evaluate(() => document.activeElement?.textContent);
    expect(focused).toBeTruthy();
  });

  test('should allow keyboard-only form submission', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss welcome modal
    const welcomeButton = page.locator('button:has-text("Explore on My Own")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // Navigate to calculation view
    await page.click('button:has-text("I Got Paid")');

    // Tab to input field
    const input = page.locator('input[placeholder="e.g. 850"]');
    await input.focus();
    
    // Type amount
    await page.keyboard.type('1500');
    
    // Press Enter to submit
    await page.keyboard.press('Enter');
    
    // Should show results
    await expect(page.locator('text=Your Guilt-Free Spending')).toBeVisible();
  });
});

test.describe('Accessibility with axe-core', () => {
  test('should have no accessibility violations on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss welcome modal
    const welcomeButton = page.locator('button:has-text("Explore on My Own")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // Check for accessibility violations
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no violations on calculation results', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss welcome modal
    const welcomeButton = page.locator('button:has-text("Explore on My Own")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // Calculate
    await page.fill('input[placeholder="e.g. 850"]', '2000');
    await page.click('button:has-text("I Got Paid!!")');
    
    // Wait for results
    await expect(page.locator('text=Your Guilt-Free Spending')).toBeVisible();

    // Check for accessibility violations
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no violations in settings view', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss welcome modal
    const welcomeButton = page.locator('button:has-text("Explore on My Own")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // Navigate to settings
    await page.click('button:has-text("Plan & Settings")');
    
    // Check for accessibility violations
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
