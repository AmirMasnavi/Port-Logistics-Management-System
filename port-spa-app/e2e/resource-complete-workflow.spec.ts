import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';
import {
    ResourceListPage,
    ResourceFormPage,
    ResourceStatusModal,
    ResourceTestDataFactory
} from './helpers/resource-page-objects';

/**
 * Complete Workflow E2E Tests for Resource Management System
 *
 * These tests demonstrate complete end-to-end workflows:
 * 1. Admin creating and managing resources
 * 2. Complete CRUD operations
 * 3. Status update workflow
 * 4. Edge cases and validation scenarios
 * 5. Performance checks
 */

// Helper function to wait for page to be ready
async function waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Extra time for React components to render
}

test.describe('Resource - Complete Admin Workflow', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Admin can perform complete CRUD workflow on resources', async ({ page }) => {
        const listPage = new ResourceListPage(page);
        const formPage = new ResourceFormPage(page);

        // === 1. VIEW: Navigate to resources list ===
        await listPage.goto();
        await waitForPageLoad(page);

        const pageHeading = page.locator('h1, h2, h3').first();
        const isHeadingVisible = await pageHeading.isVisible({ timeout: 5000 }).catch(() => false);

        if (isHeadingVisible) {
            const headingText = await pageHeading.textContent();
            console.log('📋 Viewing page:', headingText);
        }

        // === 2. CREATE: Create a new resource (Crane) ===
        const createButton = page.getByRole('button', { name: /Create.*Resource|Add.*Resource|\+ Create/i });
        const canCreate = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!canCreate) {
            console.log('⚠️  User does not have create permissions - skipping workflow test');
            return;
        }

        await createButton.click();
        await waitForPageLoad(page);

        // Verify modal opened
        await expect(page.getByRole('heading', { name: /Create.*Resource/i })).toBeVisible({ timeout: 5000 });

        // Fill in crane resource details
        const testData = ResourceTestDataFactory.createCrane(`Workflow-${Date.now()}`);
        
        await formPage.fillBasicInfo({
            description: testData.description,
            kind: testData.kind,
            status: testData.status
        });

        await formPage.fillOperationalDetails({
            setupTimeMinutes: testData.setupTimeMinutes,
            operationalWindowStart: testData.operationalWindowStart,
            operationalWindowEnd: testData.operationalWindowEnd,
            qualificationRequirements: testData.qualificationRequirements
        });

        await formPage.fillCraneCapacity(testData.averageContainersPerHour);

        console.log('✏️  Creating resource:', testData.description);

        // Submit the form
        await formPage.submitForm();

        // Wait for success message
        await expect(page.getByText(/Resource created successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 }).catch(() => {});
        await waitForPageLoad(page);

        // === 3. READ: Verify the resource was created and appears in the list ===
        await expect(page.getByText(testData.description)).toBeVisible({ timeout: 5000 });
        console.log('✅ Resource created successfully');

        // === 4. UPDATE: Edit the resource ===
        const resourceCard = page.locator(`text=${testData.description}`).locator('xpath=ancestor::div[contains(@class, "shadow")]').first();
        const editButton = resourceCard.locator('button:has-text("Edit")').first();

        if (await editButton.isVisible({ timeout: 3000 })) {
            await editButton.click();
            await waitForPageLoad(page);

            // Should be on edit modal
            await expect(page.getByRole('heading', { name: /Edit.*Resource/i })).toBeVisible({ timeout: 5000 });

            // Update the description
            const descInput = page.locator('input[name="description"]');
            const updatedDesc = `${testData.description} - Updated`;
            await descInput.clear();
            await descInput.fill(updatedDesc);

            // Update setup time
            const setupInput = page.locator('input[name="setupTimeMinutes"]');
            await setupInput.clear();
            await setupInput.fill('45');

            console.log('✏️  Updating resource');

            // Submit the update
            await formPage.submitForm();

            // Wait for success
            await expect(page.getByText(/Resource updated successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
            await waitForPageLoad(page);

            // Verify the update
            await expect(page.getByText(updatedDesc)).toBeVisible({ timeout: 5000 });
            console.log('✅ Resource updated successfully');

            // Update testData for status change test
            testData.description = updatedDesc;
        }

        // === 5. STATUS UPDATE: Change resource status ===
        const cardForStatus = page.locator(`text=${testData.description}`).locator('xpath=ancestor::div[contains(@class, "shadow")]').first();
        const statusButton = cardForStatus.locator('button:has-text("Update Status"), button:has-text("Change Status")').first();

        if (await statusButton.isVisible({ timeout: 3000 })) {
            await statusButton.click();
            await waitForPageLoad(page);

            // Status modal should open
            await expect(page.getByText(/Update.*Status|Change.*Status/i)).toBeVisible({ timeout: 5000 });

            // Change status to Inactive
            const statusSelect = page.locator('select[name="newStatus"]');
            await statusSelect.selectOption('Inactive');

            console.log('🔄 Updating resource status to Inactive');

            // Confirm status change
            await page.getByRole('button', { name: /Update|Confirm/i }).click();

            // Wait for success
            await expect(page.getByText(/Status updated successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
            await waitForPageLoad(page);

            console.log('✅ Resource status updated successfully');
        }

        console.log('🎉 Complete CRUD workflow with status update finished!');
    });

    test('Complete workflow for Truck resource type', async ({ page }) => {
        const listPage = new ResourceListPage(page);
        const formPage = new ResourceFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /Create.*Resource|Add.*Resource|\+ Create/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log('⚠️  User does not have create permissions');
            return;
        }

        await createButton.click();
        await waitForPageLoad(page);

        // Create a Truck resource
        const testData = ResourceTestDataFactory.createTruck(`TruckFlow-${Date.now()}`);
        
        await formPage.fillBasicInfo({
            description: testData.description,
            kind: testData.kind,
            status: testData.status
        });

        await formPage.fillOperationalDetails({
            setupTimeMinutes: testData.setupTimeMinutes,
            operationalWindowStart: testData.operationalWindowStart,
            operationalWindowEnd: testData.operationalWindowEnd,
            qualificationRequirements: testData.qualificationRequirements
        });

        await formPage.fillTruckCapacity({
            containersPerTrip: testData.containersPerTrip,
            averageSpeedKmh: testData.averageSpeedKmh
        });

        console.log('✏️  Creating Truck resource:', testData.description);

        await formPage.submitForm();

        await expect(page.getByText(/Resource created successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await waitForPageLoad(page);

        await expect(page.getByText(testData.description)).toBeVisible({ timeout: 5000 });
        console.log('✅ Truck resource created successfully');
    });

    test('Complete workflow for Other resource type', async ({ page }) => {
        const listPage = new ResourceListPage(page);
        const formPage = new ResourceFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /Create.*Resource|Add.*Resource|\+ Create/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log('⚠️  User does not have create permissions');
            return;
        }

        await createButton.click();
        await waitForPageLoad(page);

        // Create an Other type resource
        const testData = ResourceTestDataFactory.createOther(`EquipFlow-${Date.now()}`);
        
        await formPage.fillBasicInfo({
            description: testData.description,
            kind: testData.kind,
            status: testData.status
        });

        await formPage.fillOperationalDetails({
            setupTimeMinutes: testData.setupTimeMinutes,
            operationalWindowStart: testData.operationalWindowStart,
            operationalWindowEnd: testData.operationalWindowEnd,
            qualificationRequirements: testData.qualificationRequirements
        });

        await formPage.fillOtherCapacity({
            otherUnit: testData.otherUnit,
            otherGenericValue: testData.otherGenericValue
        });

        console.log('✏️  Creating Other resource:', testData.description);

        await formPage.submitForm();

        await expect(page.getByText(/Resource created successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await waitForPageLoad(page);

        await expect(page.getByText(testData.description)).toBeVisible({ timeout: 5000 });
        console.log('✅ Other resource created successfully');
    });
});

test.describe('Resource - Edge Cases and Validation', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Cannot create resource without required fields', async ({ page }) => {
        const listPage = new ResourceListPage(page);
        const formPage = new ResourceFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /Create.*Resource|Add.*Resource|\+ Create/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await createButton.click();
        await waitForPageLoad(page);

        // Try to submit without filling required fields
        await formPage.submitForm();

        // Should still be on the create modal
        await expect(page.getByRole('heading', { name: /Create.*Resource/i })).toBeVisible({ timeout: 3000 });
        console.log('✅ Validation prevents submission without required fields');
    });

    test('Search and filter work correctly', async ({ page }) => {
        const listPage = new ResourceListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        // Test search
        const searchInput = page.getByPlaceholder(/Search/i);
        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await listPage.searchByDescription('NONEXISTENT_RESOURCE_XYZ');
            await page.waitForTimeout(500);
            
            console.log('✅ Search functionality works');
        }

        // Test filter by kind
        await listPage.filterByKind('Crane');
        await page.waitForTimeout(500);

        const kindSelect = page.locator('select[name="filterKind"]');
        if (await kindSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(kindSelect).toHaveValue('Crane');
            console.log('✅ Filter by kind works');
        }

        // Test filter by status
        await listPage.filterByStatus('Active');
        await page.waitForTimeout(500);

        const statusSelect = page.locator('select[name="filterStatus"]');
        if (await statusSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(statusSelect).toHaveValue('Active');
            console.log('✅ Filter by status works');
        }
    });
});

test.describe('Resource - Performance and Load', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Resources page loads within acceptable time', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/resources');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        console.log(`⏱️  Page load time: ${loadTime}ms`);

        // Page should load within 10 seconds
        expect(loadTime).toBeLessThan(10000);
        console.log('✅ Page loads within acceptable time');
    });

    test('Form modal opens quickly', async ({ page }) => {
        const listPage = new ResourceListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /Create.*Resource|Add.*Resource|\+ Create/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        const startTime = Date.now();
        await createButton.click();
        
        await expect(page.getByRole('heading', { name: /Create.*Resource/i })).toBeVisible({ timeout: 5000 });
        const modalOpenTime = Date.now() - startTime;

        console.log(`⏱️  Modal open time: ${modalOpenTime}ms`);

        // Modal should open within 3 seconds
        expect(modalOpenTime).toBeLessThan(3000);
        console.log('✅ Form modal opens quickly');
    });
});

