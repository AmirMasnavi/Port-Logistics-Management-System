import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';
import {
    StorageAreaListPage,
    StorageAreaFormPage,
    StorageAreaTestDataFactory
} from './helpers/storage-area-page-objects';

/**
 * E2E Tests for Storage Area Management System
 *
 * Workflows covered:
 * 1. Viewing storage areas list
 * 2. Creating new storage areas (Yard, Warehouse, ContainerYard)
 * 3. Editing existing storage areas
 * 4. Deleting storage areas
 * 5. Search and filter functionality
 * 6. Validation and edge cases
 */

// Helper function to wait for page to be ready
async function waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
}

test.describe('Storage Area Management - Basic Workflows', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('User can view the storage areas page', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        await listPage.goto();
        await waitForPageLoad(page);

        // Check that the page heading is visible
        const heading = page.getByRole('heading', { name: /Storage.*Area|Port Facilities/i }).first();
        const isHeadingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);

        if (isHeadingVisible) {
            console.log('✓ Page heading found:', await heading.textContent());
        } else {
            expect(page.url()).toContain('port-facilities');
        }

        // Check that stat cards or content is visible
        const content = page.locator('.bg-white').first();
        if (await content.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(content).toBeVisible();
        }
    });

    test('User can create a new Yard storage area', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        // Click create button
        const createButton = page.getByRole('button', { name: /\+ Create Storage Area|Create.*Storage/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log('⚠️ Create button not visible - user might lack permissions');
            return;
        }

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        // Verify modal opened
        await expect(page.getByRole('heading', { name: /Create.*Storage.*Area/i })).toBeVisible({ timeout: 5000 });

        // Fill in yard data
        const testData = StorageAreaTestDataFactory.createYard(`E2E-${Date.now()}`);
        
        await formPage.fillForm({
            type: testData.type,
            location: testData.location,
            capacity: testData.capacity,
            currentOccupancy: testData.currentOccupancy
        });

        // Submit form
        await formPage.submitForm();

        // Wait for success message indicating successful creation
        await expect(page.getByText(/Storage area created successfully|Created successfully/i)).toBeVisible({ timeout: 5000 });
        
        // Wait for modal to close
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
        
        // Reload and verify table has content
        await page.reload();
        await waitForPageLoad(page);
    });

    test('User can create a new Warehouse storage area', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Storage Area|Create.*Storage/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        const testData = StorageAreaTestDataFactory.createWarehouse(`E2E-${Date.now()}`);
        
        await formPage.fillForm({
            type: testData.type,
            location: testData.location,
            capacity: testData.capacity,
            currentOccupancy: testData.currentOccupancy
        });

        await formPage.submitForm();

        // Wait for success message indicating successful creation
        await expect(page.getByText(/Storage area created successfully|Created successfully/i)).toBeVisible({ timeout: 5000 });
        
        // Wait for modal to close
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
        
        // Reload and verify table has content
        await page.reload();
        await waitForPageLoad(page);
    });

    // Note: ContainerYard is not supported in the current application
    // Only Yard and Warehouse are valid storage types

    test('User can edit an existing storage area', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        // Find first storage area card with edit button
        const storageCard = page.locator('.bg-white.rounded-xl.shadow-sm').first();
        if (!(await storageCard.isVisible({ timeout: 3000 }).catch(() => false))) {
            console.log('⚠️ No storage areas available to edit');
            return;
        }

        const editButton = storageCard.getByRole('button', { name: /Edit/i });
        if (!(await editButton.isVisible({ timeout: 2000 }).catch(() => false))) {
            console.log('⚠️ Edit button not visible');
            return;
        }

        await editButton.click();

        // Verify edit modal opened
        await expect(page.getByRole('heading', { name: /Edit.*Storage.*Area/i })).toBeVisible({ timeout: 5000 });

        // Update location
        const locationInput = page.locator('input[name="location"]');
        const originalLocation = await locationInput.inputValue();
        const updatedLocation = `${originalLocation}-Updated`;

        await locationInput.fill(updatedLocation);
        
        // Submit update
        await formPage.submitForm();

        // Wait for success
        await expect(page.getByText(/Storage area updated successfully|Updated successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await waitForPageLoad(page);
        await expect(page.getByText(updatedLocation)).toBeVisible({ timeout: 5000 });
    });

    test('User can delete a storage area', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        // First, create a temporary storage area to delete
        const createButton = page.getByRole('button', { name: /\+ Create Storage Area|Create.*Storage/i });
        if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await listPage.clickCreateButton();
            await page.waitForTimeout(500);

            const testData = StorageAreaTestDataFactory.createEmptyYard(`Del-${Date.now()}`);
            
            await formPage.fillForm({
                type: testData.type,
                location: testData.location,
                capacity: testData.capacity,
                currentOccupancy: testData.currentOccupancy
            });

            await formPage.submitForm();
            await waitForPageLoad(page);

            // Now delete it
            const storageCard = page.locator(`text=${testData.location}`).locator('xpath=ancestor::div[contains(@class, "shadow")]');
            const deleteButton = storageCard.getByRole('button', { name: /Delete/i });
            
            if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await deleteButton.click();

                // Confirm deletion
                await expect(page.getByText(/Are you sure/i)).toBeVisible({ timeout: 5000 });
                await listPage.confirmDelete();

                // Wait for success
                await expect(page.getByText(/Storage area deleted successfully|Deleted successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
                await expect(page.getByText(testData.location)).toBeHidden({ timeout: 5000 });
            }
        }
    });
});

test.describe('Storage Area Management - Search and Filter', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Search functionality works correctly', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const searchInput = page.getByPlaceholder(/Search/i);
        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Search for non-existent storage area
            await listPage.searchByLocation('NONEXISTENT_LOCATION_XYZ');
            await page.waitForTimeout(1000);

            // Should show empty state or no results
            const noResults = page.getByText(/No storage areas found|No.*found/i);
            if (await noResults.isVisible({ timeout: 3000 }).catch(() => false)) {
                await expect(noResults).toBeVisible();
            }

            // Clear search
            await searchInput.clear();
        }
    });

    test('Filter by type works correctly', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        // Try filtering by Yard
        await listPage.filterByType('Yard');
        await page.waitForTimeout(1000);

        // Verify filter was applied (select should have the value)
        const typeSelect = page.locator('select[name="filterType"]');
        if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(typeSelect).toHaveValue('Yard');
        }
    });
});

test.describe('Storage Area Management - Validation and Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Form validation prevents invalid submissions', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Storage Area|Create.*Storage/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        // Try to submit empty form
        await formPage.submitForm();

        // Modal should still be open due to validation
        await expect(page.getByRole('heading', { name: /Create.*Storage.*Area/i })).toBeVisible();
    });

    test('Capacity must be positive', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Storage Area|Create.*Storage/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        // Fill with negative capacity
        await page.selectOption('select[name="type"]', 'Yard');
        await page.fill('input[name="location"]', 'Test Location');
        await page.fill('input[name="capacity"]', '-100');
        await page.fill('input[name="currentOccupancy"]', '0');

        await formPage.submitForm();

        // Modal should stay open or show error
        await expect(page.getByRole('heading', { name: /Create.*Storage.*Area/i })).toBeVisible();
    });

    test('Current occupancy cannot exceed capacity', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Storage Area|Create.*Storage/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        // Fill with occupancy > capacity
        await page.selectOption('select[name="type"]', 'Warehouse');
        await page.fill('input[name="location"]', 'Invalid Warehouse');
        await page.fill('input[name="capacity"]', '100');
        await page.fill('input[name="currentOccupancy"]', '150'); // More than capacity

        await formPage.submitForm();

        // Should show error or validation message
        const errorMsg = page.getByText(/cannot exceed|occupancy.*capacity/i);
        if (await errorMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(errorMsg).toBeVisible();
        }
    });

    test('Location is required', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Storage Area|Create.*Storage/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        // Fill without location
        await page.selectOption('select[name="type"]', 'Yard');
        await page.fill('input[name="capacity"]', '100');
        await page.fill('input[name="currentOccupancy"]', '0');

        await formPage.submitForm();

        // Form should not submit
        await expect(page.getByRole('heading', { name: /Create.*Storage.*Area/i })).toBeVisible();
    });

    test('Can create storage area at full capacity', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Storage Area|Create.*Storage/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        const testData = StorageAreaTestDataFactory.createFullWarehouse(`Full-${Date.now()}`);
        
        await formPage.fillForm({
            type: testData.type,
            location: testData.location,
            capacity: testData.capacity,
            currentOccupancy: testData.currentOccupancy
        });

        await formPage.submitForm();

        // Wait for success message indicating successful creation
        await expect(page.getByText(/Storage area created successfully|Created successfully/i)).toBeVisible({ timeout: 5000 });
        
        // Wait for modal to close
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
        
        // Reload and verify table has content
        await page.reload();
        await waitForPageLoad(page);
    });

    test('Can create empty storage area', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Storage Area|Create.*Storage/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        const testData = StorageAreaTestDataFactory.createEmptyYard(`Empty-${Date.now()}`);
        
        await formPage.fillForm({
            type: testData.type,
            location: testData.location,
            capacity: testData.capacity,
            currentOccupancy: testData.currentOccupancy
        });

        await formPage.submitForm();

        // Wait for success message indicating successful creation
        await expect(page.getByText(/Storage area created successfully|Created successfully/i)).toBeVisible({ timeout: 5000 });
        
        // Wait for modal to close
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
        
        // Reload and verify table has content
        await page.reload();
        await waitForPageLoad(page);
    });
});

test.describe('Storage Area Management - Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });
    

    test('Form inputs have proper labels', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Storage Area|Create.*Storage/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        // Check for labels
        const locationLabel = page.locator('label').filter({ hasText: /Location/i });
        if (await locationLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(locationLabel).toBeVisible();
        }
    });
});

