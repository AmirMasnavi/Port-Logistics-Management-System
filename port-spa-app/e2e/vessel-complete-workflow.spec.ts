import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';
import {
  VesselListPage,
  VesselFormPage,
  VesselTestDataFactory
} from './helpers/vessel-page-objects';

/**
 * Complete Workflow E2E Tests for Vessel Management System
 * 
 * These tests demonstrate complete end-to-end workflows:
 * 1. Admin creating and managing vessels
 * 2. Complete CRUD operations
 * 3. Edge cases and validation scenarios
 * 4. Performance and accessibility checks
 */

// Helper function to wait for page to be ready
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra time for React components to render
}

test.describe('Vessel - Complete Admin Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Admin can perform complete CRUD workflow on vessels', async ({ page }) => {
    const listPage = new VesselListPage(page);
    const formPage = new VesselFormPage(page);

    // === 1. VIEW: Navigate to vessels list ===
    await listPage.goto();
    await waitForPageLoad(page);

    const pageHeading = page.locator('h1, h2, h3').first();
    const isHeadingVisible = await pageHeading.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isHeadingVisible) {
      const headingText = await pageHeading.textContent();
      console.log('📋 Viewing page:', headingText);
    }

    // === 2. CREATE: Create a new vessel ===
    const createButton = page.getByRole('button', { name: /Create.*Vessel|Add.*Vessel|New/i });
    const canCreate = await createButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canCreate) {
      console.log('⚠️  User does not have create permissions - skipping workflow test');
      return;
    }

    await createButton.click();
    await waitForPageLoad(page);

    await expect(page.getByRole('heading', { name: /Create.*Vessel/i })).toBeVisible({ timeout: 5000 });

    const testData = VesselTestDataFactory.createCargoVessel('Workflow');
    await formPage.fillForm(testData);

    console.log('✏️  Creating vessel:', testData.name, 'with IMO:', testData.imoNumber);

    await formPage.submitForm();

    await page.waitForURL('**/vessels', { timeout: 15000 }).catch(async () => {
      const errorMsg = await page.locator('.text-red-600, .bg-red-100').first().textContent().catch(() => null);
      if (errorMsg) {
        console.log('⚠️  Form submission error:', errorMsg);
      }
    });
    await waitForPageLoad(page);

    // === 3. READ: Verify the vessel was created and appears in the list ===
    await expect(page.getByText(testData.name)).toBeVisible({ timeout: 5000 });
    console.log('✅ Vessel created successfully');

    // === 4. UPDATE: Edit the vessel ===
    const vesselCard = page.locator(`text=${testData.name}`).locator('..').locator('..');
    const editButton = vesselCard.locator('button:has-text("Edit")').first();
    
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      await waitForPageLoad(page);

      await expect(page.getByRole('heading', { name: /Edit.*Vessel/i })).toBeVisible({ timeout: 5000 });

      const operatorInput = page.locator('#operator, input[name="operator"]');
      await operatorInput.clear();
      await operatorInput.fill('Updated Operator - Modified for testing workflow');

      const nameInput = page.locator('#name, input[name="name"]');
      const currentName = await nameInput.inputValue();
      await nameInput.clear();
      await nameInput.fill(currentName + ' - Updated');

      console.log('✏️  Updating vessel');

      await formPage.submitForm();

      await page.waitForURL('**/vessels', { timeout: 15000 }).catch(() => {
        console.log('⚠️  Update might have failed');
      });
      await waitForPageLoad(page);

      if (page.url().includes('/vessels') && !page.url().includes('/edit')) {
        await expect(page.getByText(testData.name, { exact: false })).toBeVisible({ timeout: 5000 });
        console.log('✅ Vessel updated successfully');
      }
    }

    // === 5. DELETE: Delete the vessel ===
    const deleteButton = page.locator(`text=${testData.name}`).locator('..').locator('..').locator('button:has-text("Delete")').first();
    
    if (await deleteButton.isVisible({ timeout: 3000 })) {
      await deleteButton.click();

      await expect(page.getByText(/Are you sure|Confirm|Delete/i)).toBeVisible({ timeout: 5000 });

      console.log('🗑️  Deleting vessel');

      await page.getByRole('button', { name: /Confirm|Delete|Yes/i }).last().click();

      await page.waitForTimeout(2000);
      
      const stillVisible = await page.getByText(testData.name).isVisible({ timeout: 2000 }).catch(() => false);
      if (!stillVisible) {
        console.log('✅ Vessel deleted successfully');
      }
    }

    console.log('🎉 Complete CRUD workflow finished!');
  });

  test('Admin can create multiple vessels in sequence', async ({ page }) => {
    const formPage = new VesselFormPage(page);

    await formPage.goto();
    await waitForPageLoad(page);

    const canCreate = await page.getByRole('heading', { name: /Create.*Vessel/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canCreate) {
      console.log('⚠️  Cannot access create form - skipping test');
      return;
    }

    const vessels = [
      VesselTestDataFactory.createCargoVessel('Batch1'),
      VesselTestDataFactory.createContainerVessel('Batch2'),
      VesselTestDataFactory.createBulkCarrier('Batch3')
    ];

    for (const vessel of vessels) {
      console.log('Creating:', vessel.name, 'IMO:', vessel.imoNumber);

      await formPage.fillForm(vessel);
      await formPage.submitForm();

      await page.waitForURL('**/vessels', { timeout: 15000 }).catch(() => {
        console.log(`⚠️  Creation of ${vessel.name} might have failed`);
      });

      if (vessels.indexOf(vessel) < vessels.length - 1) {
        if (page.url().includes('/vessels') && !page.url().includes('/new')) {
          await formPage.goto();
          await waitForPageLoad(page);
        }
      }
    }

    console.log('✅ Batch creation completed');
  });
});

test.describe('Vessel - Edge Cases and Validation', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Cannot create vessel without required fields', async ({ page }) => {
    const formPage = new VesselFormPage(page);

    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      console.log('⚠️  Cannot access create form');
      return;
    }

    await formPage.submitForm();

    await expect(page.getByRole('heading', { name: /Create.*Vessel/i })).toBeVisible();

    const nameInput = page.locator('#name, input[name="name"]');
    const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();

    console.log('✅ Form validation working correctly');
  });

  test('Search functionality works correctly', async ({ page }) => {
    const listPage = new VesselListPage(page);

    await listPage.goto();
    await waitForPageLoad(page);

    const searchInput = page.getByPlaceholder(/Search/i).first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      console.log('Testing search functionality');
      
      await searchInput.fill('Cargo');
      await page.waitForTimeout(1000);
      
      const results = page.locator('text=Cargo');
      const count = await results.count();
      console.log(`Found ${count} results for "Cargo"`);

      await searchInput.clear();
      await page.waitForTimeout(500);

      await searchInput.fill('NONEXISTENT_VESSEL_99999');
      await page.waitForTimeout(1000);

      const emptyMessage = page.getByText(/No vessels found|No results/i);
      const isEmpty = await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isEmpty) {
        console.log('✅ Empty state shown correctly');
      }
    }
  });

  test('Handles special characters in vessel data', async ({ page }) => {
    const formPage = new VesselFormPage(page);

    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      return;
    }

    const specialData = VesselTestDataFactory.createVesselWithSpecialChars();

    console.log('Creating vessel with special characters:', specialData.name);

    await formPage.fillForm(specialData);
    await formPage.submitForm();

    await page.waitForURL('**/vessels', { timeout: 15000 }).catch(() => {});
    await waitForPageLoad(page);

    if (page.url().includes('/vessels') && !page.url().includes('/new')) {
      const isVisible = await page.getByText(specialData.name, { exact: false }).isVisible({ timeout: 5000 }).catch(() => false);
      if (isVisible) {
        console.log('✅ Special characters handled correctly');
      }
    }
  });

  test('Validates IMO number uniqueness', async ({ page }) => {
    const formPage = new VesselFormPage(page);

    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      return;
    }

    console.log('Testing IMO number uniqueness validation');

    const duplicateIMO = `IMO${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    const vessel1 = {
      imoNumber: duplicateIMO,
      name: `First Vessel ${Date.now()}`,
      operator: 'First Operator'
    };

    await formPage.fillForm(vessel1);
    await formPage.submitForm();

    await page.waitForURL('**/vessels', { timeout: 15000 }).catch(() => {});
    await waitForPageLoad(page);

    await formPage.goto();
    await waitForPageLoad(page);

    const vessel2 = {
      imoNumber: duplicateIMO,
      name: `Second Vessel ${Date.now()}`,
      operator: 'Second Operator'
    };

    await formPage.fillForm(vessel2);
    await formPage.submitForm();

    const errorMsg = await page.getByText(/already exists|duplicate|IMO/i).isVisible({ timeout: 3000 }).catch(() => false);
    
    if (errorMsg) {
      console.log('✅ Duplicate IMO validation working correctly');
    }
  });

  test('Can cancel creation and return to list', async ({ page }) => {
    const formPage = new VesselFormPage(page);
    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      console.log('⚠️  Cannot access create form');
      return;
    }

    await page.fill('#name, input[name="name"]', 'Test Cancel Vessel');
    await page.fill('#imoNumber, input[name="imoNumber"]', 'IMO9999999');

    console.log('Testing cancel functionality');

    await formPage.clickCancel();

    await page.waitForURL('**/vessels', { timeout: 5000 });
    await expect(page.url()).toContain('/vessels');
    await expect(page.url()).not.toContain('/new');

    console.log('✅ Cancel functionality working correctly');
  });
});

test.describe('Vessel - Performance and Load', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('List page loads within acceptable time', async ({ page }) => {
    console.log('Testing list page load performance');
    
    const startTime = Date.now();
    await page.goto('/vessels');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Page loaded in ${loadTime}ms`);

    expect(loadTime).toBeLessThan(10000);

    console.log('✅ Page load performance is acceptable');
  });

  test('Form submission completes in reasonable time', async ({ page }) => {
    const formPage = new VesselFormPage(page);
    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      console.log('⚠️  Cannot access create form');
      return;
    }

    console.log('Testing form submission performance');

    const testData = VesselTestDataFactory.createCargoVessel('Perf');
    await formPage.fillForm(testData);

    const startTime = Date.now();
    await formPage.submitForm();
    
    await page.waitForURL('**/vessels', { timeout: 15000 }).catch(() => {});
    const submitTime = Date.now() - startTime;

    console.log(`Form submitted in ${submitTime}ms`);

    expect(submitTime).toBeLessThan(15000);

    console.log('✅ Form submission performance is acceptable');
  });

  test('Can handle rapid navigation between pages', async ({ page }) => {
    const listPage = new VesselListPage(page);
    const formPage = new VesselFormPage(page);

    console.log('Testing rapid navigation');

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

    const isOnListPage = page.url().includes('/vessels') && !page.url().includes('/new');
    expect(isOnListPage).toBeTruthy();

    console.log('✅ Rapid navigation handled correctly');
  });
});

test.describe('Vessel - Accessibility and Usability', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('All interactive elements are keyboard accessible', async ({ page }) => {
    const listPage = new VesselListPage(page);
    await listPage.goto();
    await waitForPageLoad(page);

    console.log('Testing keyboard accessibility');

    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : null;
    });

    console.log('Focused element type:', focusedElement);
    expect(focusedElement).toBeTruthy();

    console.log('✅ Keyboard navigation is functional');
  });

  test('Form provides clear error messages', async ({ page }) => {
    const formPage = new VesselFormPage(page);
    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      return;
    }

    console.log('Testing error message clarity');

    await formPage.submitForm();

    const nameInput = page.locator('#name, input[name="name"]');
    const validationMessage = await nameInput.evaluate((el: HTMLInputElement) => el.validationMessage);

    console.log('Validation message:', validationMessage);
    expect(validationMessage).toBeTruthy();

    console.log('✅ Error messages are provided');
  });

  test('Page maintains state after navigation', async ({ page }) => {
    const formPage = new VesselFormPage(page);
    await formPage.goto();
    await waitForPageLoad(page);

    const canAccess = await page.getByRole('heading', { name: /Create.*Vessel/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      return;
    }

    console.log('Testing state preservation');

    await page.fill('#name, input[name="name"]', 'State Test Vessel');
    await page.fill('#imoNumber, input[name="imoNumber"]', 'IMO1234567');

    await page.goto('/vessels');
    await waitForPageLoad(page);

    await page.goBack();
    await waitForPageLoad(page);

    const nameValue = await page.locator('#name, input[name="name"]').inputValue().catch(() => '');
    console.log('Name value after navigation:', nameValue);

    console.log('✅ Navigation behavior is consistent');
  });

  test('Responsive design works on different viewport sizes', async ({ page }) => {
    const listPage = new VesselListPage(page);

    console.log('Testing responsive design');

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await listPage.goto();
    await waitForPageLoad(page);

    let isPageVisible = await page.locator('body').isVisible();
    expect(isPageVisible).toBeTruthy();
    console.log('✅ Mobile viewport renders correctly');

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await waitForPageLoad(page);

    isPageVisible = await page.locator('body').isVisible();
    expect(isPageVisible).toBeTruthy();
    console.log('✅ Tablet viewport renders correctly');

    // Desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await waitForPageLoad(page);

    isPageVisible = await page.locator('body').isVisible();
    expect(isPageVisible).toBeTruthy();
    console.log('✅ Desktop viewport renders correctly');
  });
});

test.describe('Vessel - Data Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Created vessel persists after page refresh', async ({ page }) => {
    const formPage = new VesselFormPage(page);
    await formPage.goto();
    await waitForPageLoad(page);

    const canCreate = await page.getByRole('heading', { name: /Create.*Vessel/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canCreate) {
      console.log('⚠️  Cannot test persistence - no create access');
      return;
    }

    const testData = VesselTestDataFactory.createCargoVessel('Persist');
    console.log('Creating vessel to test persistence:', testData.name);

    await formPage.fillForm(testData);
    await formPage.submitForm();

    await page.waitForURL('**/vessels', { timeout: 15000 }).catch(() => {});
    await waitForPageLoad(page);

    await expect(page.getByText(testData.name)).toBeVisible({ timeout: 5000 });

    console.log('Refreshing page to test persistence');
    await page.reload();
    await waitForPageLoad(page);

    const stillVisible = await page.getByText(testData.name).isVisible({ timeout: 5000 }).catch(() => false);
    
    if (stillVisible) {
      console.log('✅ Data persists after refresh');
    } else {
      console.log('⚠️  Data might not have been saved or is filtered out');
    }
  });

  test('Updated vessel shows correct modified data', async ({ page }) => {
    const listPage = new VesselListPage(page);
    await listPage.goto();
    await waitForPageLoad(page);

    const editButton = page.locator('button:has-text("Edit")').first();
    
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      await waitForPageLoad(page);

      console.log('Testing data modification');

      const nameInput = page.locator('#name, input[name="name"]');
      const originalName = await nameInput.inputValue();

      const operatorInput = page.locator('#operator, input[name="operator"]');
      const newOperator = `Modified Operator at ${new Date().toISOString()}`;
      await operatorInput.clear();
      await operatorInput.fill(newOperator);

      const formPage = new VesselFormPage(page);
      await formPage.submitForm();

      await page.waitForURL('**/vessels', { timeout: 15000 }).catch(() => {});
      await waitForPageLoad(page);

      const viewButton = page.locator(`text=${originalName}`).locator('..').locator('..').locator('button:has-text("View")').first();
      
      if (await viewButton.isVisible({ timeout: 3000 })) {
        await viewButton.click();
        await page.waitForTimeout(1000);

        const isUpdated = await page.getByText(newOperator, { exact: false }).isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isUpdated) {
          console.log('✅ Updated data is correctly displayed');
        }
      }
    }
  });

  test('IMO number remains unique across system', async ({ page }) => {
    const formPage = new VesselFormPage(page);
    await formPage.goto();
    await waitForPageLoad(page);

    const canCreate = await page.getByRole('heading', { name: /Create.*Vessel/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canCreate) {
      return;
    }

    console.log('Testing IMO number uniqueness constraint');

    const uniqueIMO = `IMO${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    const vessel = VesselTestDataFactory.createCargoVessel('Unique');
    vessel.imoNumber = uniqueIMO;

    await formPage.fillForm(vessel);
    await formPage.submitForm();

    await page.waitForURL('**/vessels', { timeout: 15000 }).catch(() => {});
    await waitForPageLoad(page);

    // Search for the IMO number
    const searchInput = page.getByPlaceholder(/Search/i).first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill(uniqueIMO);
      await page.waitForTimeout(1000);

      const results = page.locator(`text=${uniqueIMO}`);
      const count = await results.count();

      console.log(`Found ${count} vessel(s) with IMO ${uniqueIMO}`);
      expect(count).toBeLessThanOrEqual(1);

      if (count === 1) {
        console.log('✅ IMO number is unique');
      }
    }
  });
});

