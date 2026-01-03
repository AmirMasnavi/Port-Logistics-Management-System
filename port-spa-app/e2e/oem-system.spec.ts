import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';

/**
 * OEM System Tests (SUT = System)
 * 
 * Covers:
 * - Incident Types Management
 * - Incidents Management
 * - Operation Plans Viewing
 */

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

test.describe('OEM System Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin to ensure access to all OEM features
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Incident Types - Create and List', async ({ page }) => {
    // 1. Navigate to Incident Types
    await page.goto('/incident-types');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: /Incident Types/i })).toBeVisible();

    // 2. Create new Incident Type
    const uniqueCode = `IT-${Date.now()}`;
    await page.getByRole('button', { name: /Create/i }).click();
    
    await page.getByLabel(/Code/i).fill(uniqueCode);
    await page.getByLabel(/Name/i).fill('Test Incident Type');
    await page.getByLabel(/Severity/i).selectOption('Minor');
    
    await page.getByRole('button', { name: /Save|Create/i }).click();

    // 3. Verify in list
    await expect(page.getByText(uniqueCode)).toBeVisible();
  });

  test('Incidents - Create and List', async ({ page }) => {
    // 1. Navigate to Incidents
    await page.goto('/incidents');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: /Incidents/i })).toBeVisible();

    // 2. Create new Incident
    await page.getByRole('button', { name: /Report Incident/i }).click();
    
    const uniqueTitle = `Incident-${Date.now()}`;
    await page.getByLabel(/Title/i).fill(uniqueTitle);
    
    // Select first available type
    const typeSelect = page.getByLabel(/Type/i);
    await typeSelect.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.getByLabel(/Severity/i).selectOption('Minor');
    
    await page.getByRole('button', { name: /Save|Submit/i }).click();

    // 3. Verify in list
    await expect(page.getByText(uniqueTitle)).toBeVisible();
  });

  test('Operation Plans - View List', async ({ page }) => {
    // 1. Navigate to Operation Plans
    await page.goto('/operation-plans');
    await waitForPageLoad(page);
    
    // 2. Verify page loaded
    await expect(page.getByRole('heading', { name: /Operation Plans/i })).toBeVisible();
    
    // 3. Check if table exists
    await expect(page.locator('table')).toBeVisible();
  });
});

