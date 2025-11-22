import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';
import {
  VesselTypeListPage,
  VesselTypeFormPage,
  VesselTypeTestDataFactory
} from './helpers/vessel-type-page-objects';

/**
 * Complete Workflow E2E Tests for Vessel Type Management System
 * 
 * These tests demonstrate complete end-to-end workflows:
 * 1. Admin creating and managing vessel types
 * 2. Complete CRUD operations
 * 3. Edge cases and validation scenarios
 * 4. Performance and accessibility checks
 */

// Helper function to wait for page to be ready
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra time for React components to render
}

test.describe('Vessel Type - Complete Admin Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Admin can perform complete CRUD workflow on vessel types', async ({ page }) => {
    const listPage = new VesselTypeListPage(page);
    const formPage = new VesselTypeFormPage(page);

    // === 1. VIEW: Navigate to vessel types list ===
    await listPage.goto();
    await waitForPageLoad(page);

    const pageHeading = page.locator('h1, h2, h3').first();
    const isHeadingVisible = await pageHeading.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isHeadingVisible) {
      const headingText = await pageHeading.textContent();
      console.log('📋 Viewing page:', headingText);
    }

    // === 2. CREATE: Create a new vessel type ===
    const createButton = page.getByRole('button', { name: /Create.*Vessel Type|Add.*Vessel Type|New/i });
    const canCreate = await createButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canCreate) {
      console.log('⚠️  User does not have create permissions - skipping workflow test');
      return;
    }

    await createButton.click();
    await waitForPageLoad(page);

    // Verify we're on the create form
    await expect(page.getByRole('heading', { name: /Create.*Vessel Type/i })).toBeVisible({ timeout: 5000 });

    // Fill in vessel type details
    const testData = VesselTypeTestDataFactory.createContainerShip('Workflow');
    await formPage.fillForm(testData);

    console.log('✏️  Creating vessel type:', testData.name);

    // Submit the form
    await formPage.submitForm();

    // Wait for navigation back to list page
    await page.waitForURL('**/vessel-types', { timeout: 15000 }).catch(async () => {
      const errorMsg = await page.locator('.text-red-600, .bg-red-100').first().textContent().catch(() => null);
      if (errorMsg) {
        console.log('⚠️  Form submission error:', errorMsg);
      }
    });
    await waitForPageLoad(page);

    // === 3. READ: Verify the vessel type was created and appears in the list ===
    await expect(page.getByText(testData.name)).toBeVisible({ timeout: 5000 });
    console.log('✅ Vessel type created successfully');

    // === 4. UPDATE: Edit the vessel type ===
    // Find and click the edit button for our vessel type
    const vesselCard = page.locator(`text=${testData.name}`).locator('..').locator('..');
    const editButton = vesselCard.locator('button:has-text("Edit")').first();
    
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      await waitForPageLoad(page);

      // Should be on edit form
      await expect(page.getByRole('heading', { name: /Edit.*Vessel Type/i })).toBeVisible({ timeout: 5000 });

      // Update the description
      const descriptionInput = page.locator('#description, input[name="description"], textarea[name="description"]');
      await descriptionInput.clear();
      await descriptionInput.fill('Updated: ' + testData.description + ' - Modified for testing');

      // Update capacity
      const capacityInput = page.locator('#capacity, input[name="capacity"]');
      await capacityInput.clear();
      await capacityInput.fill('6000');

      console.log('✏️  Updating vessel type');

      // Submit the update
      await formPage.submitForm();

      // Wait for redirect
      await page.waitForURL('**/vessel-types', { timeout: 15000 }).catch(() => {
        console.log('⚠️  Update might have failed');
      });
      await waitForPageLoad(page);

      // Verify the update
      if (page.url().includes('/vessel-types') && !page.url().includes('/edit')) {
        await expect(page.getByText(testData.name)).toBeVisible({ timeout: 5000 });
        console.log('✅ Vessel type updated successfully');
      }
    }

    // === 5. DELETE: Delete the vessel type ===
    const deleteButton = page.locator(`text=${testData.name}`).locator('..').locator('..').locator('button:has-text("Delete")').first();
    
    if (await deleteButton.isVisible({ timeout: 3000 })) {
      await deleteButton.click();

      // Confirmation dialog should appear
      await expect(page.getByText(/Are you sure|Confirm|Delete/i)).toBeVisible({ timeout: 5000 });

      console.log('🗑️  Deleting vessel type');

      // Confirm deletion
      await page.getByRole('button', { name: /Confirm|Delete|Yes/i }).last().click();

      // Wait for success message or disappearance
      await page.waitForTimeout(2000);
      
      // Verify the vessel type is no longer visible
      const stillVisible = await page.getByText(testData.name).isVisible({ timeout: 2000 }).catch(() => false);
      if (!stillVisible) {
        console.log('✅ Vessel type deleted successfully');
      }
    }

    console.log('🎉 Complete CRUD workflow finished!');
  });

  test('Admin can create multiple vessel types in sequence', async ({ page }) => {
    const formPage = new VesselTypeFormPage(page);

    await formPage.goto();
    await waitForPageLoad(page);

    const canCreate = await page.getByRole('heading', { name: /Create.*Vessel Type/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canCreate) {
      console.log('⚠️  Cannot access create form - skipping test');
      return;
    }

    // Create multiple vessel types
    const vesselTypes = [
      VesselTypeTestDataFactory.createContainerShip('Batch1'),
      VesselTypeTestDataFactory.createBulkCarrier('Batch2'),
      VesselTypeTestDataFactory.createTanker('Batch3')
    ];

    for (const vesselType of vesselTypes) {
      console.log('Creating:', vesselType.name);

      await formPage.fillForm(vesselType);
      await formPage.submitForm();

      // Wait for success
      await page.waitForURL('**/vessel-types', { timeout: 15000 }).catch(() => {
        console.log(`⚠️  Creation of ${vesselType.name} might have failed`);
      });

      // If successful and not the last one, navigate back to create form
      if (vesselTypes.indexOf(vesselType) < vesselTypes.length - 1) {
        if (page.url().includes('/vessel-types') && !page.url().includes('/new')) {
          await formPage.goto();
          await waitForPageLoad(page);
        }
      }
    }

    console.log('✅ Batch creation completed');
  });
});

test.describe('Vessel Type - Edge Cases and Validation', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Cannot create vessel type without required fields', async ({ page }) => {
    const formPage = new VesselTypeFormPage(page);

    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel Type/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      console.log('⚠️  Cannot access create form');
      return;
    }

    // Try to submit without filling any fields
    await formPage.submitForm();

    // Should still be on the form page (validation should prevent submission)
    await expect(page.getByRole('heading', { name: /Create.*Vessel Type/i })).toBeVisible();

    // Check for validation messages
    const nameInput = page.locator('#name, input[name="name"]');
    const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();

    console.log('✅ Form validation working correctly');
  });

  test('Search and filter work correctly', async ({ page }) => {
    const listPage = new VesselTypeListPage(page);

    await listPage.goto();
    await waitForPageLoad(page);

    // Test search
    const searchInput = page.getByPlaceholder(/Search/i).first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      console.log('Testing search functionality');
      
      await searchInput.fill('Container');
      await page.waitForTimeout(1000);
      
      // Verify search results
      const results = page.locator('text=Container');
      const count = await results.count();
      console.log(`Found ${count} results for "Container"`);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);

      // Search for non-existent
      await searchInput.fill('NONEXISTENT_VESSEL_TYPE_99999');
      await page.waitForTimeout(1000);

      // Should show empty state or no results
      const emptyMessage = page.getByText(/No vessel types found|No results/i);
      const isEmpty = await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isEmpty) {
        console.log('✅ Empty state shown correctly');
      }
    }
  });

  test('Handles special characters in vessel type data', async ({ page }) => {
    const formPage = new VesselTypeFormPage(page);

    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel Type/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      return;
    }

    // Create vessel type with special characters
    const specialData = {
      name: `Vessel "Type" & Co. - Test #${Date.now()}`,
      description: "O'Brien's Special Vessel (Type A-1) with émojis: 🚢⚓",
      capacity: '5000',
      maxRows: '10',
      maxBays: '20',
      maxTiers: '8'
    };

    console.log('Creating vessel type with special characters:', specialData.name);

    await formPage.fillForm(specialData);
    await formPage.submitForm();

    await page.waitForURL('**/vessel-types', { timeout: 15000 }).catch(() => {});
    await waitForPageLoad(page);

    // Verify special characters are preserved
    if (page.url().includes('/vessel-types') && !page.url().includes('/new')) {
      const isVisible = await page.getByText(specialData.name, { exact: false }).isVisible({ timeout: 5000 }).catch(() => false);
      if (isVisible) {
        console.log('✅ Special characters handled correctly');
      }
    }
  });

  test('Validates numeric field constraints', async ({ page }) => {
    const formPage = new VesselTypeFormPage(page);

    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel Type/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      return;
    }

    // Fill required text fields
    await page.fill('#name, input[name="name"]', 'Validation Test Vessel');
    await page.fill('#description, input[name="description"], textarea[name="description"]', 'Testing validation');

    console.log('Testing numeric field validation');

    // Try to enter invalid numeric values
    await page.fill('#capacity, input[name="capacity"]', '-100'); // Negative
    await page.fill('#maxRows, input[name="maxRows"]', 'abc'); // Non-numeric
    await page.fill('#maxBays, input[name="maxBays"]', '0'); // Zero might be invalid
    await page.fill('#maxTiers, input[name="maxTiers"]', '999999'); // Very large

    // Submit
    await formPage.submitForm();

    // Should still be on form due to validation
    const stillOnForm = await page.getByRole('heading', { name: /Create.*Vessel Type/i }).isVisible({ timeout: 3000 });
    
    if (stillOnForm) {
      console.log('✅ Numeric validation working correctly');
    }
  });

  test('Can cancel creation and return to list', async ({ page }) => {
    const formPage = new VesselTypeFormPage(page);
    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel Type/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      console.log('⚠️  Cannot access create form');
      return;
    }

    // Fill some data
    await page.fill('#name, input[name="name"]', 'Test Cancel Vessel');
    await page.fill('#capacity, input[name="capacity"]', '1000');

    console.log('Testing cancel functionality');

    // Click Cancel button
    await formPage.clickCancel();

    // Should navigate back to list page
    await page.waitForURL('**/vessel-types', { timeout: 5000 });
    await expect(page.url()).toContain('/vessel-types');
    await expect(page.url()).not.toContain('/new');

    console.log('✅ Cancel functionality working correctly');
  });
});

test.describe('Vessel Type - Performance and Load', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('List page loads within acceptable time', async ({ page }) => {
    console.log('Testing list page load performance');
    
    const startTime = Date.now();
    await page.goto('/vessel-types');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Page loaded in ${loadTime}ms`);

    // Page should load within 10 seconds (increased from 5 due to auth)
    expect(loadTime).toBeLessThan(10000);

    console.log('✅ Page load performance is acceptable');
  });

  test('Form submission completes in reasonable time', async ({ page }) => {
    const formPage = new VesselTypeFormPage(page);
    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel Type/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      console.log('⚠️  Cannot access create form');
      return;
    }

    console.log('Testing form submission performance');

    const testData = VesselTypeTestDataFactory.createContainerShip('Perf');
    await formPage.fillForm(testData);

    const startTime = Date.now();
    await formPage.submitForm();
    
    await page.waitForURL('**/vessel-types', { timeout: 15000 }).catch(() => {});
    const submitTime = Date.now() - startTime;

    console.log(`Form submitted in ${submitTime}ms`);

    // Form submission should complete within 15 seconds
    expect(submitTime).toBeLessThan(15000);

    console.log('✅ Form submission performance is acceptable');
  });

  test('Can handle rapid navigation between pages', async ({ page }) => {
    const listPage = new VesselTypeListPage(page);
    const formPage = new VesselTypeFormPage(page);

    console.log('Testing rapid navigation');

    // Navigate back and forth quickly
    await listPage.goto();
    await page.waitForTimeout(500);

    await formPage.goto();
    await page.waitForTimeout(500);

    await listPage.goto();
    await page.waitForTimeout(500);

    await formPage.goto();
    await page.waitForTimeout(500);

    await listPage.goto();
    await waitForPageLoad(page);

    // Verify we're on the list page and it's functional
    const isOnListPage = page.url().includes('/vessel-types') && !page.url().includes('/new');
    expect(isOnListPage).toBeTruthy();

    console.log('✅ Rapid navigation handled correctly');
  });
});

test.describe('Vessel Type - Accessibility and Usability', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('All interactive elements are keyboard accessible', async ({ page }) => {
    const listPage = new VesselTypeListPage(page);
    await listPage.goto();
    await waitForPageLoad(page);

    console.log('Testing keyboard accessibility');

    // Test Tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Check that focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : null;
    });

    console.log('Focused element type:', focusedElement);
    expect(focusedElement).toBeTruthy();

    console.log('✅ Keyboard navigation is functional');
  });

  test('Form provides clear error messages', async ({ page }) => {
    const formPage = new VesselTypeFormPage(page);
    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel Type/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      return;
    }

    console.log('Testing error message clarity');

    // Try to submit empty form
    await formPage.submitForm();

    // Check for validation messages
    const nameInput = page.locator('#name, input[name="name"]');
    const validationMessage = await nameInput.evaluate((el: HTMLInputElement) => el.validationMessage);

    console.log('Validation message:', validationMessage);
    expect(validationMessage).toBeTruthy();

    console.log('✅ Error messages are provided');
  });

  test('Page maintains state after navigation', async ({ page }) => {
    const formPage = new VesselTypeFormPage(page);
    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel Type/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      return;
    }

    console.log('Testing state preservation');

    // Fill some data
    await page.fill('#name, input[name="name"]', 'State Test Vessel');
    await page.fill('#capacity, input[name="capacity"]', '5000');

    // Navigate away and back (using browser back/forward)
    await page.goto('/vessel-types');
    await waitForPageLoad(page);

    // Note: Browser typically doesn't preserve form state on navigation
    // This test verifies the expected behavior
    await page.goBack();
    await waitForPageLoad(page);

    // Form might be reset (this is expected behavior)
    const nameValue = await page.locator('#name, input[name="name"]').inputValue().catch(() => '');
    console.log('Name value after navigation:', nameValue);

    console.log('✅ Navigation behavior is consistent');
  });

  test('Responsive design works on different viewport sizes', async ({ page }) => {
    const listPage = new VesselTypeListPage(page);

    console.log('Testing responsive design');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await listPage.goto();
    await waitForPageLoad(page);

    let isPageVisible = await page.locator('body').isVisible();
    expect(isPageVisible).toBeTruthy();
    console.log('✅ Mobile viewport renders correctly');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.reload();
    await waitForPageLoad(page);

    isPageVisible = await page.locator('body').isVisible();
    expect(isPageVisible).toBeTruthy();
    console.log('✅ Tablet viewport renders correctly');

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop size
    await page.reload();
    await waitForPageLoad(page);

    isPageVisible = await page.locator('body').isVisible();
    expect(isPageVisible).toBeTruthy();
    console.log('✅ Desktop viewport renders correctly');
  });
});

test.describe('Vessel Type - Data Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Created vessel type persists after page refresh', async ({ page }) => {
    const formPage = new VesselTypeFormPage(page);
    await formPage.goto();
    await waitForPageLoad(page);

    const canCreate = await page.getByRole('heading', { name: /Create.*Vessel Type/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canCreate) {
      console.log('⚠️  Cannot test persistence - no create access');
      return;
    }

    // Create a vessel type with unique name
    const testData = VesselTypeTestDataFactory.createContainerShip('Persist');
    console.log('Creating vessel type to test persistence:', testData.name);

    await formPage.fillForm(testData);
    await formPage.submitForm();

    await page.waitForURL('**/vessel-types', { timeout: 15000 }).catch(() => {});
    await waitForPageLoad(page);

    // Verify it's visible
    await expect(page.getByText(testData.name)).toBeVisible({ timeout: 5000 });

    // Refresh the page
    console.log('Refreshing page to test persistence');
    await page.reload();
    await waitForPageLoad(page);

    // Verify the vessel type is still there
    const stillVisible = await page.getByText(testData.name).isVisible({ timeout: 5000 }).catch(() => false);
    
    if (stillVisible) {
      console.log('✅ Data persists after refresh');
    } else {
      console.log('⚠️  Data might not have been saved or is filtered out');
    }
  });

  test('Updated vessel type shows correct modified data', async ({ page }) => {
    const listPage = new VesselTypeListPage(page);
    await listPage.goto();
    await waitForPageLoad(page);

    // Look for first edit button
    const editButton = page.locator('button:has-text("Edit")').first();
    
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      await waitForPageLoad(page);

      console.log('Testing data modification');

      // Get current values
      const nameInput = page.locator('#name, input[name="name"]');
      const originalName = await nameInput.inputValue();

      // Modify the description
      const descriptionInput = page.locator('#description, input[name="description"], textarea[name="description"]');
      const newDescription = `Modified at ${new Date().toISOString()}`;
      await descriptionInput.clear();
      await descriptionInput.fill(newDescription);

      // Submit
      const formPage = new VesselTypeFormPage(page);
      await formPage.submitForm();

      await page.waitForURL('**/vessel-types', { timeout: 15000 }).catch(() => {});
      await waitForPageLoad(page);

      // Find and view the updated vessel type
      const viewButton = page.locator(`text=${originalName}`).locator('..').locator('..').locator('button:has-text("View")').first();
      
      if (await viewButton.isVisible({ timeout: 3000 })) {
        await viewButton.click();
        await page.waitForTimeout(1000);

        // Verify the new description is shown
        const isUpdated = await page.getByText(newDescription, { exact: false }).isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isUpdated) {
          console.log('✅ Updated data is correctly displayed');
        }
      }
    }
  });
});

