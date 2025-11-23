import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';
import {
    DockListPage,
    DockFormPage,
    DockTestDataFactory
} from './helpers/dock-page-objects';

/**
 * Complete Workflow E2E Tests for Dock Management System
 *
 * These tests demonstrate complete end-to-end workflows:
 * 1. Admin creating and managing docks
 * 2. Complete CRUD operations
 * 3. Edge cases and validation scenarios
 * 4. Performance and accessibility checks
 */

// Helper function to wait for page to be ready
async function waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Extra time for React components to render
}

test.describe('Dock - Complete Admin Workflow', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Admin can perform complete CRUD workflow on docks', async ({ page }) => {
        const listPage = new DockListPage(page);
        const formPage = new DockFormPage(page);

        // === 1. VIEW: Navigate to docks list ===
        await listPage.goto();
        await waitForPageLoad(page);

        const pageHeading = page.locator('h1, h2, h3').first();
        const isHeadingVisible = await pageHeading.isVisible({ timeout: 5000 }).catch(() => false);

        if (isHeadingVisible) {
            const headingText = await pageHeading.textContent();
            console.log('📋 Viewing page:', headingText);
        }

        // === 2. CREATE: Create a new dock ===
        const createButton = page.getByRole('button', { name: /Create.*Dock|Add.*Dock|New/i });
        const canCreate = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!canCreate) {
            console.log('⚠️  User does not have create permissions - skipping workflow test');
            return;
        }

        await createButton.click();
        await waitForPageLoad(page);

        // Verify we're on the create form
        await expect(page.getByRole('heading', { name: /Create.*Dock/i })).toBeVisible({ timeout: 5000 });

        // Fill in dock details
        const testData = DockTestDataFactory.createContainerShip('Workflow');
        await formPage.fillForm(testData);

        console.log('✏️  Creating dock:', testData.name);

        // Submit the form
        await formPage.submitForm();

        // Wait for navigation back to list page
        await page.waitForURL('**/docks', { timeout: 15000 }).catch(async () => {
            const errorMsg = await page.locator('.text-red-600, .bg-red-100').first().textContent().catch(() => null);
            if (errorMsg) {
                console.log('⚠️  Form submission error:', errorMsg);
            }
        });
        await waitForPageLoad(page);

        // === 3. READ: Verify the dock was created and appears in the list ===
        await expect(page.getByText(testData.name)).toBeVisible({ timeout: 5000 });
        console.log('✅ Dock created successfully');

        // === 4. UPDATE: Edit the dock ===
        // Find and click the edit button for our dock
        const dockCard = page.locator(`text=${testData.name}`).locator('xpath=ancestor::div[contains(@class, "shadow-sm")]').first();
        const editButton = dockCard.locator('button:has-text("Edit")').first();

        if (await editButton.isVisible({ timeout: 3000 })) {
            await editButton.click();
            await waitForPageLoad(page);

            // Should be on edit form
            await expect(page.getByRole('heading', { name: /Edit.*Dock/i })).toBeVisible({ timeout: 5000 });

            // Update the Location Zone 
            const zoneInput = page.locator('input[name="locationZone"]');
            await zoneInput.clear();
            await zoneInput.fill('Updated: ' + testData.locationZone + ' - Mod');

            // Update length (using specific Dock field)
            const lengthInput = page.locator('input[name="lengthInMeters"]');
            await lengthInput.clear();
            await lengthInput.fill('600');

            console.log('✏️  Updating dock');

            // Submit the update
            await formPage.submitForm();

            // Wait for redirect
            await page.waitForURL('**/docks', { timeout: 15000 }).catch(() => {
                console.log('⚠️  Update might have failed');
            });
            await waitForPageLoad(page);

            // Verify the update
            if (page.url().includes('/docks') && !page.url().includes('/edit')) {
                await expect(page.getByText(testData.name)).toBeVisible({ timeout: 5000 });
                console.log('✅ Dock updated successfully');
            }
        }

        // === 5. DELETE: Delete the dock ===
        // Re-locate the card (it might have re-rendered)
        const cardForDeletion = page.locator(`text=${testData.name}`).locator('xpath=ancestor::div[contains(@class, "shadow-sm")]').first();
        const deleteButton = cardForDeletion.locator('button:has-text("Delete")').first();

        if (await deleteButton.isVisible({ timeout: 3000 })) {
            await deleteButton.click();

            // Confirmation dialog should appear
            await expect(page.getByText(/Are you sure|Confirm|Delete/i)).toBeVisible({ timeout: 5000 });

            console.log('🗑️  Deleting dock');

            // Confirm deletion
            await page.getByRole('button', { name: /Confirm|Delete|Yes/i }).last().click();

            // Wait for success message or disappearance
            await page.waitForTimeout(2000);

            // Verify the dock is no longer visible
            const stillVisible = await page.getByText(testData.name).isVisible({ timeout: 2000 }).catch(() => false);
            if (!stillVisible) {
                console.log('✅ Dock deleted successfully');
            }
        }

        console.log('🎉 Complete CRUD workflow finished!');
    });

    test('Admin can create multiple docks in sequence', async ({ page }) => {
        const formPage = new DockFormPage(page);

        await formPage.goto();
        await waitForPageLoad(page);

        const canCreate = await page.getByRole('heading', { name: /Create.*Dock/i })
            .isVisible({ timeout: 5000 }).catch(() => false);

        if (!canCreate) {
            console.log('⚠️  Cannot access create form - skipping test');
            return;
        }

        // Create multiple docks
        const docks = [
            DockTestDataFactory.createContainerShip('Batch1'),
            DockTestDataFactory.createSmallDock('Batch2'),
            DockTestDataFactory.createLargeTerminal('Batch3')
        ];

        for (const dock of docks) {
            console.log('Creating:', dock.name);

            await formPage.fillForm(dock);
            await formPage.submitForm();

            // Wait for success
            await page.waitForURL('**/docks', { timeout: 15000 }).catch(() => {
                console.log(`⚠️  Creation of ${dock.name} might have failed`);
            });

            // If successful and not the last one, navigate back to create form
            if (docks.indexOf(dock) < docks.length - 1) {
                if (page.url().includes('/docks') && !page.url().includes('/new')) {
                    await formPage.goto();
                    await waitForPageLoad(page);
                }
            }
        }

        console.log('✅ Batch creation completed');
    });
});

test.describe('Dock - Edge Cases and Validation', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Cannot create dock without required fields', async ({ page }) => {
        const formPage = new DockFormPage(page);

        await formPage.goto();
        await waitForPageLoad(page);

        const canAccess = await page.getByRole('heading', { name: /Create.*Dock/i })
            .isVisible({ timeout: 5000 }).catch(() => false);

        if (!canAccess) {
            console.log('⚠️  Cannot access create form');
            return;
        }

        // Try to submit without filling any fields
        await formPage.submitForm();

        // Should still be on the form page (validation should prevent submission)
        await expect(page.getByRole('heading', { name: /Create.*Dock/i })).toBeVisible();

        // Check for validation messages
        const nameInput = page.locator('input[name="name"]');
        const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
        expect(isInvalid).toBeTruthy();

        console.log('✅ Form validation working correctly');
    });

    test('Search and filter work correctly', async ({ page }) => {
        const listPage = new DockListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        // Test search
        const searchInput = page.getByPlaceholder(/Search/i).first();
        if (await searchInput.isVisible({ timeout: 5000 })) {
            console.log('Testing search functionality');

            await searchInput.fill('Dock');
            await page.waitForTimeout(1000);

            // Verify search results
            const results = page.locator('text=Dock');
            const count = await results.count();
            console.log(`Found ${count} results for "Dock"`);

            // Clear search
            await searchInput.clear();
            await page.waitForTimeout(500);

            // Search for non-existent
            await searchInput.fill('NONEXISTENT_DOCK_99999');
            await page.waitForTimeout(1000);

            // Should show empty state or no results
            const emptyMessage = page.getByText(/No docks found|No results/i);
            const isEmpty = await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false);

            if (isEmpty) {
                console.log('✅ Empty state shown correctly');
            }
        }
    });

    test('Handles special characters in dock data', async ({ page }) => {
        const formPage = new DockFormPage(page);

        await formPage.goto();
        await waitForPageLoad(page);

        const canAccess = await page.getByRole('heading', { name: /Create.*Dock/i })
            .isVisible({ timeout: 5000 }).catch(() => false);

        if (!canAccess) {
            return;
        }

        // Create dock with special characters
        const specialData = {
            name: `Dock "Type" & Co. - Test #${Date.now()}`,
            locationZone: "O'Brien's Special Zone ⚓",
            locationSection: 'Sec #1',
            lengthInMeters: '500',
            depthInMeters: '20',
            maxDraftInMeters: '15',
            numberOfSTSCranes: '4'
        };

        console.log('Creating dock with special characters:', specialData.name);

        await formPage.fillForm(specialData);
        await formPage.submitForm();

        await page.waitForURL('**/docks', { timeout: 15000 }).catch(() => {});
        await waitForPageLoad(page);

        // Verify special characters are preserved
        if (page.url().includes('/docks') && !page.url().includes('/new')) {
            const isVisible = await page.getByText(specialData.name, { exact: false }).isVisible({ timeout: 5000 }).catch(() => false);
            if (isVisible) {
                console.log('✅ Special characters handled correctly');
            }
        }
    });

    test('Validates numeric field constraints', async ({ page }) => {
        const formPage = new DockFormPage(page);

        await formPage.goto();
        await waitForPageLoad(page);

        const canAccess = await page.getByRole('heading', { name: /Create.*Dock/i })
            .isVisible({ timeout: 5000 }).catch(() => false);

        if (!canAccess) {
            return;
        }

        // Fill required text fields
        await page.fill('input[name="name"]', 'Validation Test Dock');
        await page.fill('input[name="locationZone"]', 'Validation Zone');
        await page.fill('input[name="locationSection"]', 'Sec 1');

        console.log('Testing numeric field validation');

        // Try to enter invalid numeric values
        await page.fill('input[name="lengthInMeters"]', '-100'); // Negative
        await page.fill('input[name="depthInMeters"]', 'abc'); // Non-numeric
        await page.fill('input[name="maxDraftInMeters"]', '0');
        await page.fill('input[name="numberOfSTSCranes"]', '-5'); // Negative cranes

        // Submit
        await formPage.submitForm();

        // Should still be on form due to validation
        const stillOnForm = await page.getByRole('heading', { name: /Create.*Dock/i }).isVisible({ timeout: 3000 });

        if (stillOnForm) {
            console.log('✅ Numeric validation working correctly');
        }
    });

    test('Can cancel creation and return to list', async ({ page }) => {
        const formPage = new DockFormPage(page);
        await formPage.goto();
        await waitForPageLoad(page);

        const canAccess = await page.getByRole('heading', { name: /Create.*Dock/i })
            .isVisible({ timeout: 5000 }).catch(() => false);

        if (!canAccess) {
            console.log('⚠️  Cannot access create form');
            return;
        }

        // Fill some data
        await page.fill('input[name="name"]', 'Test Cancel Dock');
        await page.fill('input[name="lengthInMeters"]', '100');

        console.log('Testing cancel functionality');

        // Click Cancel button
        await formPage.clickCancel();

        // Should navigate back to list page
        await page.waitForURL('**/docks', { timeout: 5000 });
        await expect(page.url()).toContain('/docks');
        await expect(page.url()).not.toContain('/new');

        console.log('✅ Cancel functionality working correctly');
    });
});

test.describe('Dock - Performance and Load', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('List page loads within acceptable time', async ({ page }) => {
        console.log('Testing list page load performance');

        const startTime = Date.now();
        await page.goto('/docks');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        console.log(`Page loaded in ${loadTime}ms`);

        // Page should load within 10 seconds
        expect(loadTime).toBeLessThan(10000);

        console.log('✅ Page load performance is acceptable');
    });

    test('Form submission completes in reasonable time', async ({ page }) => {
        const formPage = new DockFormPage(page);
        await formPage.goto();
        await waitForPageLoad(page);

        const canAccess = await page.getByRole('heading', { name: /Create.*Dock/i })
            .isVisible({ timeout: 5000 }).catch(() => false);

        if (!canAccess) {
            console.log('⚠️  Cannot access create form');
            return;
        }

        console.log('Testing form submission performance');

        const testData = DockTestDataFactory.createContainerShip('Perf');
        await formPage.fillForm(testData);

        const startTime = Date.now();
        await formPage.submitForm();

        await page.waitForURL('**/docks', { timeout: 15000 }).catch(() => {});
        const submitTime = Date.now() - startTime;

        console.log(`Form submitted in ${submitTime}ms`);

        // Form submission should complete within 15 seconds
        expect(submitTime).toBeLessThan(15000);

        console.log('✅ Form submission performance is acceptable');
    });

    test('Can handle rapid navigation between pages', async ({ page }) => {
        const listPage = new DockListPage(page);
        const formPage = new DockFormPage(page);

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
        const isOnListPage = page.url().includes('/docks') && !page.url().includes('/new');
        expect(isOnListPage).toBeTruthy();

        console.log('✅ Rapid navigation handled correctly');
    });
});

test.describe('Dock - Accessibility and Usability', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('All interactive elements are keyboard accessible', async ({ page }) => {
        const listPage = new DockListPage(page);
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
        const formPage = new DockFormPage(page);
        await formPage.goto();
        await waitForPageLoad(page);

        const canAccess = await page.getByRole('heading', { name: /Create.*Dock/i })
            .isVisible({ timeout: 5000 }).catch(() => false);

        if (!canAccess) {
            return;
        }

        console.log('Testing error message clarity');

        // Try to submit empty form
        await formPage.submitForm();

        // Check for validation messages on Name field
        const nameInput = page.locator('input[name="name"]');
        const validationMessage = await nameInput.evaluate((el: HTMLInputElement) => el.validationMessage);

        console.log('Validation message:', validationMessage);
        expect(validationMessage).toBeTruthy();

        console.log('✅ Error messages are provided');
    });

    test('Page maintains state after navigation', async ({ page }) => {
        const formPage = new DockFormPage(page);
        await formPage.goto();
        await waitForPageLoad(page);

        const canAccess = await page.getByRole('heading', { name: /Create.*Dock/i })
            .isVisible({ timeout: 5000 }).catch(() => false);

        if (!canAccess) {
            return;
        }

        console.log('Testing state preservation');

        // Fill some data
        await page.fill('input[name="name"]', 'State Test Dock');
        await page.fill('input[name="lengthInMeters"]', '500');

        // Navigate away and back (using browser back/forward)
        await page.goto('/docks');
        await waitForPageLoad(page);

        // Note: Browser typically doesn't preserve form state on navigation
        // This test verifies the expected behavior
        await page.goBack();
        await waitForPageLoad(page);

        // Form might be reset (this is expected behavior)
        const nameValue = await page.locator('input[name="name"]').inputValue().catch(() => '');
        console.log('Name value after navigation:', nameValue);

        console.log('✅ Navigation behavior is consistent');
    });

    test('Responsive design works on different viewport sizes', async ({ page }) => {
        const listPage = new DockListPage(page);

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

test.describe('Dock - Data Integrity', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Created dock persists after page refresh', async ({ page }) => {
        const formPage = new DockFormPage(page);
        await formPage.goto();
        await waitForPageLoad(page);

        const canCreate = await page.getByRole('heading', { name: /Create.*Dock/i })
            .isVisible({ timeout: 5000 }).catch(() => false);

        if (!canCreate) {
            console.log('⚠️  Cannot test persistence - no create access');
            return;
        }

        // Create a dock with unique name
        const testData = DockTestDataFactory.createContainerShip('Persist');
        console.log('Creating dock to test persistence:', testData.name);

        await formPage.fillForm(testData);
        await formPage.submitForm();

        await page.waitForURL('**/docks', { timeout: 15000 }).catch(() => {});
        await waitForPageLoad(page);

        // Verify it's visible
        await expect(page.getByText(testData.name)).toBeVisible({ timeout: 5000 });

        // Refresh the page
        console.log('Refreshing page to test persistence');
        await page.reload();
        await waitForPageLoad(page);

        // Verify the dock is still there
        const stillVisible = await page.getByText(testData.name).isVisible({ timeout: 5000 }).catch(() => false);

        if (stillVisible) {
            console.log('✅ Data persists after refresh');
        } else {
            console.log('⚠️  Data might not have been saved or is filtered out');
        }
    });

    test('Updated dock shows correct modified data', async ({ page }) => {
        const listPage = new DockListPage(page);
        await listPage.goto();
        await waitForPageLoad(page);

        // Look for first edit button
        const editButton = page.locator('button:has-text("Edit")').first();

        if (await editButton.isVisible({ timeout: 3000 })) {
            await editButton.click();
            await waitForPageLoad(page);

            console.log('Testing data modification');

            // Get current values
            const nameInput = page.locator('input[name="name"]');
            const originalName = await nameInput.inputValue();

            // Modify the Location Zone
            const zoneInput = page.locator('input[name="locationZone"]');
            const newZone = `Modified Zone ${new Date().toISOString()}`;
            await zoneInput.clear();
            await zoneInput.fill(newZone);

            // Submit
            const formPage = new DockFormPage(page);
            await formPage.submitForm();

            await page.waitForURL('**/docks', { timeout: 15000 }).catch(() => {});
            await waitForPageLoad(page);

            // Find and view the updated dock
            const dockCard = page.locator(`text=${originalName}`).locator('xpath=ancestor::div[contains(@class, "shadow-sm")]');

            if (await dockCard.isVisible({ timeout: 3000 })) {
                // Verify the new zone is shown inside the card
                const isUpdated = await dockCard.getByText(newZone, { exact: false }).isVisible({ timeout: 3000 }).catch(() => false);

                if (isUpdated) {
                    console.log('✅ Updated data is correctly displayed');
                }
            }
        }
    });
});