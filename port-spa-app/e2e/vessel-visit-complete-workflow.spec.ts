import { test, expect } from '@playwright/test';
import {
  VesselVisitListPage,
  VesselVisitCreatePage,
  VvnDecisionModal,
  TestDataFactory,
} from './helpers/page-objects';
import { RealAuthHelper } from './helpers/real-auth';

/**
 * Comprehensive E2E Test Suite using Page Object Model
 * 
 * This demonstrates a complete user journey through the vessel visit notification system.
 */

test.describe('Edge Cases and Validation', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Cannot create notification without required fields', async ({ page }) => {
    const createPage = new VesselVisitCreatePage(page);

    await createPage.goto();
    
    // Try to go to next step without filling required fields
    await createPage.goToNextStep();

    // Should still be on step 1 due to HTML5 validation
    await createPage.expectOnStep(1);
  });

  test('Search and filter work correctly', async ({ page }) => {
    const listPage = new VesselVisitListPage(page);

    await listPage.goto();

    // Test search
    await listPage.searchByImo('NONEXISTENT');
    await page.waitForTimeout(500);
    
    // Should show empty state or no results
    const emptyMessage = page.getByText(/No notifications found/i);
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });

    // Clear search
    await page.getByPlaceholder(/Search by vessel name or IMO/i).clear();

    // Test filter
    const filterSelect = page.locator('select').first();
    if (await filterSelect.isVisible({ timeout: 3000 })) {
      await filterSelect.selectOption('Approved');
      await page.waitForTimeout(500);
      
      // Verify filter was applied (URL or visible cards should reflect this)
      await expect(filterSelect).toHaveValue('Approved');
    }
  });
});

test.describe('Performance and Load', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/vessel-visits');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Page should load within 10 seconds (increased from 5 due to auth)
    expect(loadTime).toBeLessThan(10000);
  });
});
