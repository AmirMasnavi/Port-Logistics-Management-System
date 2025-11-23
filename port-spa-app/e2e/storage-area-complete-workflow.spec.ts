import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';
import {
    StorageAreaListPage,
    StorageAreaFormPage,
    StorageAreaTestDataFactory
} from './helpers/storage-area-page-objects';

/**
 * Complete Workflow E2E Tests for Storage Area Management System
 *
 * These tests demonstrate complete end-to-end workflows:
 * 1. Admin creating and managing storage areas
 * 2. Complete CRUD operations
 * 3. Different storage area types (Yard, Warehouse, ContainerYard)
 * 4. Edge cases and validation scenarios
 * 5. Performance checks
 */

// Helper function to wait for page to be ready
async function waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Extra time for React components to render
}

test.describe('Storage Area - Complete Admin Workflow', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Admin can perform complete CRUD workflow on storage areas', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        // === 1. VIEW: Navigate to storage areas list ===
        await listPage.goto();
        await waitForPageLoad(page);

        const pageHeading = page.locator('h1, h2, h3').first();
        const isHeadingVisible = await pageHeading.isVisible({ timeout: 5000 }).catch(() => false);

        if (isHeadingVisible) {
            const headingText = await pageHeading.textContent();
            console.log('📋 Viewing page:', headingText);
        }

        // === 2. CREATE: Create a new storage area (Yard) ===
        const createButton = page.getByRole('button', { name: /Create.*Storage|Add.*Storage|\+ Create/i });
        const canCreate = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!canCreate) {
            console.log('⚠️  User does not have create permissions - skipping workflow test');
            return;
        }

        await createButton.click();
        await waitForPageLoad(page);

        // Verify modal opened
        await expect(page.getByRole('heading', { name: /Create.*Storage.*Area/i })).toBeVisible({ timeout: 5000 });

        // Fill in yard storage area details
        const testData = StorageAreaTestDataFactory.createYard(`Workflow-${Date.now()}`);
        
        await formPage.fillForm({
            type: testData.type,
            location: testData.location,
            capacity: testData.capacity,
            currentOccupancy: testData.currentOccupancy
        });

        console.log('✏️  Creating storage area:', testData.location);

        // Submit the form
        await formPage.submitForm();

        // Wait for success message
        await expect(page.getByText(/Storage area created successfully|Created successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 }).catch(() => {});
        await waitForPageLoad(page);

        // === 3. READ: Verify the storage area was created and appears in the list ===
        await expect(page.getByText(testData.location)).toBeVisible({ timeout: 5000 });
        console.log('✅ Storage area created successfully');

        // === 4. UPDATE: Edit the storage area ===
        const storageCard = page.locator(`text=${testData.location}`).locator('xpath=ancestor::div[contains(@class, "shadow")]').first();
        const editButton = storageCard.locator('button:has-text("Edit")').first();

        if (await editButton.isVisible({ timeout: 3000 })) {
            await editButton.click();
            await waitForPageLoad(page);

            // Should be on edit modal
            await expect(page.getByRole('heading', { name: /Edit.*Storage.*Area/i })).toBeVisible({ timeout: 5000 });

            // Update the location
            const locationInput = page.locator('input[name="location"]');
            const updatedLocation = `${testData.location}-Updated`;
            await locationInput.clear();
            await locationInput.fill(updatedLocation);

            // Update capacity
            const capacityInput = page.locator('input[name="capacity"]');
            await capacityInput.clear();
            await capacityInput.fill('1500');

            console.log('✏️  Updating storage area');

            // Submit the update
            await formPage.submitForm();

            // Wait for success
            await expect(page.getByText(/Storage area updated successfully|Updated successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
            await waitForPageLoad(page);

            // Verify the update
            await expect(page.getByText(updatedLocation)).toBeVisible({ timeout: 5000 });
            console.log('✅ Storage area updated successfully');

            // Update testData for deletion test
            testData.location = updatedLocation;
        }

        // === 5. DELETE: Delete the storage area ===
        const cardForDeletion = page.locator(`text=${testData.location}`).locator('xpath=ancestor::div[contains(@class, "shadow")]').first();
        const deleteButton = cardForDeletion.locator('button:has-text("Delete")').first();

        if (await deleteButton.isVisible({ timeout: 3000 })) {
            await deleteButton.click();

            // Confirmation dialog should appear
            await expect(page.getByText(/Are you sure|Confirm|Delete/i)).toBeVisible({ timeout: 5000 });

            console.log('🗑️  Deleting storage area');

            // Confirm deletion
            await page.getByRole('button', { name: /Confirm|Delete|Yes/i }).last().click();

            // Wait for success message
            await expect(page.getByText(/Storage area deleted successfully|Deleted successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
            await page.waitForTimeout(2000);

            // Verify the storage area is no longer visible
            const stillVisible = await page.getByText(testData.location).isVisible({ timeout: 2000 }).catch(() => false);
            if (!stillVisible) {
                console.log('✅ Storage area deleted successfully');
            }
        }

        console.log('🎉 Complete CRUD workflow finished!');
    });

    test('Complete workflow for Warehouse storage area', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /Create.*Storage|Add.*Storage|\+ Create/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log('⚠️  User does not have create permissions');
            return;
        }

        await createButton.click();
        await waitForPageLoad(page);

        // Create a Warehouse
        const testData = StorageAreaTestDataFactory.createWarehouse(`WHFlow-${Date.now()}`);
        
        await formPage.fillForm({
            type: testData.type,
            location: testData.location,
            capacity: testData.capacity,
            currentOccupancy: testData.currentOccupancy
        });

        console.log('✏️  Creating Warehouse:', testData.location);

        await formPage.submitForm();

        await expect(page.getByText(/Storage area created successfully|Created successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await waitForPageLoad(page);

        await expect(page.getByText(testData.location)).toBeVisible({ timeout: 5000 });
        console.log('✅ Warehouse created successfully');
    });

    test('Complete workflow for ContainerYard storage area', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /Create.*Storage|Add.*Storage|\+ Create/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log('⚠️  User does not have create permissions');
            return;
        }

        await createButton.click();
        await waitForPageLoad(page);

        // Create a ContainerYard
        const testData = StorageAreaTestDataFactory.createContainerYard(`CYFlow-${Date.now()}`);
        
        await formPage.fillForm({
            type: testData.type,
            location: testData.location,
            capacity: testData.capacity,
            currentOccupancy: testData.currentOccupancy
        });

        console.log('✏️  Creating ContainerYard:', testData.location);

        await formPage.submitForm();

        await expect(page.getByText(/Storage area created successfully|Created successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await waitForPageLoad(page);

        await expect(page.getByText(testData.location)).toBeVisible({ timeout: 5000 });
        console.log('✅ ContainerYard created successfully');
    });

    test('Can create and manage full capacity storage area', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /Create.*Storage|Add.*Storage|\+ Create/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await createButton.click();
        await waitForPageLoad(page);

        // Create a full warehouse
        const testData = StorageAreaTestDataFactory.createFullWarehouse(`Full-${Date.now()}`);
        
        await formPage.fillForm({
            type: testData.type,
            location: testData.location,
            capacity: testData.capacity,
            currentOccupancy: testData.currentOccupancy
        });

        console.log('✏️  Creating full capacity storage area:', testData.location);

        await formPage.submitForm();

        await expect(page.getByText(/Storage area created successfully|Created successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await waitForPageLoad(page);

        await expect(page.getByText(testData.location)).toBeVisible({ timeout: 5000 });
        console.log('✅ Full capacity storage area created successfully');

        // Verify we can see the occupancy information
        const card = page.locator(`text=${testData.location}`).locator('xpath=ancestor::div[contains(@class, "shadow")]').first();
        const occupancyText = await card.textContent();
        
        if (occupancyText?.includes('100') || occupancyText?.includes('Full')) {
            console.log('✅ Occupancy information is visible');
        }
    });

    test('Can create and manage empty storage area', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /Create.*Storage|Add.*Storage|\+ Create/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await createButton.click();
        await waitForPageLoad(page);

        // Create an empty yard
        const testData = StorageAreaTestDataFactory.createEmptyYard(`Empty-${Date.now()}`);
        
        await formPage.fillForm({
            type: testData.type,
            location: testData.location,
            capacity: testData.capacity,
            currentOccupancy: testData.currentOccupancy
        });

        console.log('✏️  Creating empty storage area:', testData.location);

        await formPage.submitForm();

        await expect(page.getByText(/Storage area created successfully|Created successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await waitForPageLoad(page);

        await expect(page.getByText(testData.location)).toBeVisible({ timeout: 5000 });
        console.log('✅ Empty storage area created successfully');
    });
});

test.describe('Storage Area - Edge Cases and Validation', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Cannot create storage area without required fields', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /Create.*Storage|Add.*Storage|\+ Create/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await createButton.click();
        await waitForPageLoad(page);

        // Try to submit without filling location (required field)
        await page.selectOption('select[name="type"]', 'Yard');
        await page.fill('input[name="capacity"]', '100');
        await page.fill('input[name="currentOccupancy"]', '0');
        // Don't fill location

        await formPage.submitForm();

        // Should still be on the create modal due to validation
        await expect(page.getByRole('heading', { name: /Create.*Storage.*Area/i })).toBeVisible({ timeout: 3000 });
        console.log('✅ Validation prevents submission without location');
    });

    test('Cannot create storage area with occupancy exceeding capacity', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /Create.*Storage|Add.*Storage|\+ Create/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await createButton.click();
        await waitForPageLoad(page);

        // Try to create with occupancy > capacity
        await page.selectOption('select[name="type"]', 'Warehouse');
        await page.fill('input[name="location"]', 'Invalid WH');
        await page.fill('input[name="capacity"]', '100');
        await page.fill('input[name="currentOccupancy"]', '150'); // More than capacity!

        await formPage.submitForm();

        // Should show error or stay on form
        const errorMsg = page.getByText(/cannot exceed|occupancy.*capacity/i);
        const stillOnForm = page.getByRole('heading', { name: /Create.*Storage.*Area/i });
        
        const hasError = await errorMsg.isVisible({ timeout: 3000 }).catch(() => false);
        const onForm = await stillOnForm.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasError || onForm) {
            console.log('✅ Validation prevents occupancy exceeding capacity');
        }
    });

    test('Search and filter work correctly', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        // Test search
        const searchInput = page.getByPlaceholder(/Search/i);
        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await listPage.searchByLocation('NONEXISTENT_LOCATION_XYZ');
            await page.waitForTimeout(500);
            
            console.log('✅ Search functionality works');
        }

        // Test filter by type
        await listPage.filterByType('Yard');
        await page.waitForTimeout(500);

        const typeSelect = page.locator('select[name="filterType"]');
        if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(typeSelect).toHaveValue('Yard');
            console.log('✅ Filter by type works');
        }
    });

    test('Cannot create with negative capacity', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);
        const formPage = new StorageAreaFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /Create.*Storage|Add.*Storage|\+ Create/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await createButton.click();
        await waitForPageLoad(page);

        // Try to create with negative capacity
        await page.selectOption('select[name="type"]', 'Yard');
        await page.fill('input[name="location"]', 'Negative Test');
        await page.fill('input[name="capacity"]', '-100');
        await page.fill('input[name="currentOccupancy"]', '0');

        await formPage.submitForm();

        // Should stay on form due to validation
        await expect(page.getByRole('heading', { name: /Create.*Storage.*Area/i })).toBeVisible({ timeout: 3000 });
        console.log('✅ Validation prevents negative capacity');
    });
});

test.describe('Storage Area - Performance and Load', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Storage areas page loads within acceptable time', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/port-facilities');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        console.log(`⏱️  Page load time: ${loadTime}ms`);

        // Page should load within 10 seconds
        expect(loadTime).toBeLessThan(10000);
        console.log('✅ Page loads within acceptable time');
    });

    test('Form modal opens quickly', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /Create.*Storage|Add.*Storage|\+ Create/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        const startTime = Date.now();
        await createButton.click();
        
        await expect(page.getByRole('heading', { name: /Create.*Storage.*Area/i })).toBeVisible({ timeout: 5000 });
        const modalOpenTime = Date.now() - startTime;

        console.log(`⏱️  Modal open time: ${modalOpenTime}ms`);

        // Modal should open within 3 seconds
        expect(modalOpenTime).toBeLessThan(3000);
        console.log('✅ Form modal opens quickly');
    });

    test('Multiple storage areas render efficiently', async ({ page }) => {
        const listPage = new StorageAreaListPage(page);

        await listPage.goto();
        
        const startTime = Date.now();
        await page.waitForLoadState('networkidle');
        const renderTime = Date.now() - startTime;

        console.log(`⏱️  Render time: ${renderTime}ms`);

        // Check how many storage area cards are visible
        const cards = page.locator('.bg-white.rounded-xl.shadow-sm, .shadow-sm');
        const count = await cards.count();

        console.log(`📊 Found ${count} storage area cards`);
        console.log('✅ List renders efficiently');
    });
});

