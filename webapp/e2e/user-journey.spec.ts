/**
 * E2E Test: Complete User Journey
 * Tests the happy path from first visit to calculating guilt-free spending.
 * 
 * Philosophy: Transparency - tests document expected user experience
 */

import { test, expect } from '@playwright/test';

test.describe('First-Time User Journey', () => {
  test('should guide new user from welcome to first calculation', async ({ page }) => {
    await page.goto('/');

    // Step 1: Welcome modal should appear for new users
    await expect(page.locator('text=Welcome to PayFlow!')).toBeVisible();
    await expect(page.locator('text=Your guilt-free spending companion')).toBeVisible();

    // Click "Let's Get Started"
    await page.click('button:has-text("Let\'s Get Started")');
    await expect(page.locator('text=Welcome to PayFlow!')).not.toBeVisible();

    // Step 2: Should be on Plan & Settings view
    await expect(page.locator('text=Plan & Settings')).toBeVisible();

    // Step 3: Add a bill
    await page.fill('input[placeholder="e.g., Rent"]', 'Rent');
    await page.fill('input[placeholder="e.g., 1000"]', '1200');
    
    // Select monthly cadence
    await page.selectOption('select', 'monthly');

    // Click Add Bill button
    await page.click('button:has-text("Add Bill")');

    // Verify bill was added
    await expect(page.locator('text=Rent')).toBeVisible();
    await expect(page.locator('text=$1,200')).toBeVisible();

    // Step 4: Add a goal
    await page.fill('input[placeholder="e.g., Emergency Fund"]', 'Savings');
    await page.fill('input[type="number"]', '10');
    await page.click('button:has-text("Add Goal")');

    // Verify goal was added
    await expect(page.locator('text=Savings')).toBeVisible();
    await expect(page.locator('text=10%')).toBeVisible();

    // Step 5: Navigate to "I Got Paid" view
    await page.click('button:has-text("I Got Paid")');

    // Step 6: Enter paycheck amount and calculate
    await page.fill('input[placeholder="e.g. 850"]', '2000');
    await page.click('button:has-text("I Got Paid!!")');

    // Step 7: Verify results are shown
    await expect(page.locator('text=Your Guilt-Free Spending')).toBeVisible();
    
    // Should show guilt-free amount
    const guiltFreeText = await page.locator('text=Your Guilt-Free Spending').locator('..').textContent();
    expect(guiltFreeText).toContain('$');

    // Should show breakdown
    await expect(page.locator('text=How we calculated this')).toBeVisible();
    
    // Should show bills section
    await expect(page.locator('text=Bills Funded This Paycheck')).toBeVisible();
    await expect(page.locator('text=Rent')).toBeVisible();
    
    // Should show goals section
    await expect(page.locator('text=Goals')).toBeVisible();
    await expect(page.locator('text=Savings')).toBeVisible();
  });
});

test.describe('Waterfall Visualization', () => {
  test('should show waterfall breakdown after calculation', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss welcome modal if present
    const welcomeButton = page.locator('button:has-text("Explore on My Own")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // Add quick bill and goal via settings
    await page.click('button:has-text("Plan & Settings")');
    await page.fill('input[placeholder="e.g., Rent"]', 'Electricity');
    await page.fill('input[placeholder="e.g., 1000"]', '150');
    await page.click('button:has-text("Add Bill")');

    // Go to calculation
    await page.click('button:has-text("I Got Paid")');
    await page.fill('input[placeholder="e.g. 850"]', '1000');
    await page.click('button:has-text("I Got Paid!!")');

    // Navigate to Waterfall view
    await page.click('button:has-text("See Waterfall")');

    // Verify waterfall elements are visible
    await expect(page.locator('text=Source')).toBeVisible();
    await expect(page.locator('text=Bills (Buckets Filling)')).toBeVisible();
    await expect(page.locator('text=The Pool (Guilt-Free)')).toBeVisible();
    
    // Should show visual flow connectors
    await expect(page.locator('text=💧')).toBeVisible();
  });
});
