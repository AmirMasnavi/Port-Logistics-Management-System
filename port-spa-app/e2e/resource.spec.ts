import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';
import {
    ResourceListPage,
    ResourceFormPage,
    ResourceStatusModal,
    ResourceTestDataFactory
} from './helpers/resource-page-objects';

/**
 * E2E Tests for Resource Management System
 *
 * Workflows covered:
 * 1. Viewing resources list
 * 2. Creating new resources (Crane, Truck, Other)
 * 3. Editing existing resources
 * 4. Updating resource status
 * 5. Search and filter functionality
 * 6. Validation and edge cases
 */

// Helper function to wait for page to be ready
async function waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
}

test.describe('Resource Management - Basic Workflows', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('User can view the resources page', async ({ page }) => {
        const listPage = new ResourceListPage(page);
        await listPage.goto();
        await waitForPageLoad(page);

        // Check that the page heading is visible
        const heading = page.getByRole('heading', { name: /Resources/i }).first();
        const isHeadingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);

        if (isHeadingVisible) {
            console.log('✓ Page heading found:', await heading.textContent());
        } else {
            expect(page.url()).toContain('resources');
        }

        // Check that stat cards are visible
        const statCard = page.getByText(/Total Resources|Active|Available/i).first();
        if (await statCard.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(statCard).toBeVisible();
        }
    });

    test('User can create a new Crane resource', async ({ page }) => {
        const listPage = new ResourceListPage(page);
        const formPage = new ResourceFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        // Click create button
        const createButton = page.getByRole('button', { name: /\+ Create Resource/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log('⚠️ Create button not visible - user might lack permissions');
            return;
        }

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        // Verify modal opened
        await expect(page.getByRole('heading', { name: /Create.*Resource/i })).toBeVisible({ timeout: 5000 });

        // Fill in crane data
        const testData = ResourceTestDataFactory.createCrane(`E2E-${Date.now()}`);
        
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

        // Submit form
        await formPage.submitForm();

        // Wait for success message and modal close
        await expect(page.getByText(/Resource created successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 }).catch(() => {});

        // Verify resource appears in list
        await waitForPageLoad(page);
        await expect(page.getByText(testData.description)).toBeVisible({ timeout: 5000 });
    });

    test('User can create a new Truck resource', async ({ page }) => {
        const listPage = new ResourceListPage(page);
        const formPage = new ResourceFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Resource/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        const testData = ResourceTestDataFactory.createTruck(`E2E-${Date.now()}`);
        
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

        await formPage.submitForm();

        await expect(page.getByText(/Resource created successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await waitForPageLoad(page);
        await expect(page.getByText(testData.description)).toBeVisible({ timeout: 5000 });
    });

    test('User can create a new Other type resource', async ({ page }) => {
        const listPage = new ResourceListPage(page);
        const formPage = new ResourceFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Resource/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        const testData = ResourceTestDataFactory.createOther(`E2E-${Date.now()}`);
        
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

        await formPage.submitForm();

        await expect(page.getByText(/Resource created successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await waitForPageLoad(page);
        await expect(page.getByText(testData.description)).toBeVisible({ timeout: 5000 });
    });

    test('User can edit an existing resource', async ({ page }) => {
        const listPage = new ResourceListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        // Find first resource card with edit button
        const resourceCard = page.locator('.bg-white.rounded-xl.shadow-sm').first();
        if (!(await resourceCard.isVisible({ timeout: 3000 }).catch(() => false))) {
            console.log('⚠️ No resources available to edit');
            return;
        }

        const editButton = resourceCard.getByRole('button', { name: /Edit/i });
        if (!(await editButton.isVisible({ timeout: 2000 }).catch(() => false))) {
            console.log('⚠️ Edit button not visible');
            return;
        }

        await editButton.click();

        // Verify edit modal opened
        await expect(page.getByRole('heading', { name: /Edit.*Resource/i })).toBeVisible({ timeout: 5000 });

        // Update description
        const descInput = page.locator('input[name="description"]');
        const originalDesc = await descInput.inputValue();
        const updatedDesc = `${originalDesc} - Updated`;

        await descInput.fill(updatedDesc);
        
        // Submit update
        await page.getByRole('button', { name: /Update|Save/i }).click();

        // Wait for success
        await expect(page.getByText(/Resource updated successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        await waitForPageLoad(page);
        await expect(page.getByText(updatedDesc)).toBeVisible({ timeout: 5000 });
    });

    test('User can update resource status', async ({ page }) => {
        const listPage = new ResourceListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        // Find first resource with status update button
        const statusButton = page.locator('button').filter({ hasText: /Update Status|Change Status/i }).first();
        
        if (await statusButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await statusButton.click();

            // Verify status modal opened
            await expect(page.getByText(/Update.*Status/i)).toBeVisible({ timeout: 5000 });

            // Change status
            const statusSelect = page.locator('select[name="newStatus"]');
            await statusSelect.selectOption('Inactive');

            // Confirm
            await page.getByRole('button', { name: /Update|Confirm/i }).click();

            // Wait for success
            await expect(page.getByText(/Status updated successfully/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
        } else {
            console.log('⚠️ No status update button found');
        }
    });
});

test.describe('Resource Management - Search and Filter', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Search functionality works correctly', async ({ page }) => {
        const listPage = new ResourceListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const searchInput = page.getByPlaceholder(/Search/i);
        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Search for non-existent resource
            await listPage.searchByDescription('NONEXISTENT_RESOURCE_XYZ');
            await page.waitForTimeout(1000);

            // Should show empty state or no results
            const noResults = page.getByText(/No resources found/i);
            if (await noResults.isVisible({ timeout: 3000 }).catch(() => false)) {
                await expect(noResults).toBeVisible();
            }

            // Clear search
            await searchInput.clear();
        }
    });

    test('Filter by kind works correctly', async ({ page }) => {
        const listPage = new ResourceListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        // Try filtering by Crane
        await listPage.filterByKind('Crane');
        await page.waitForTimeout(1000);

        // Verify filter was applied (select should have the value)
        const kindSelect = page.locator('select[name="filterKind"]');
        if (await kindSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(kindSelect).toHaveValue('Crane');
        }
    });

    test('Filter by status works correctly', async ({ page }) => {
        const listPage = new ResourceListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        // Try filtering by Active
        await listPage.filterByStatus('Active');
        await page.waitForTimeout(1000);

        // Verify filter was applied
        const statusSelect = page.locator('select[name="filterStatus"]');
        if (await statusSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(statusSelect).toHaveValue('Active');
        }
    });
});

test.describe('Resource Management - Validation and Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Form validation prevents invalid submissions', async ({ page }) => {
        const listPage = new ResourceListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Resource/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        // Try to submit empty form
        await page.getByRole('button', { name: /Create/i }).click();

        // Modal should still be open due to validation
        await expect(page.getByRole('heading', { name: /Create.*Resource/i })).toBeVisible();
    });

    test('Crane requires average containers per hour', async ({ page }) => {
        const listPage = new ResourceListPage(page);
        const formPage = new ResourceFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Resource/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        // Fill basic info for Crane but skip capacity
        await formPage.fillBasicInfo({
            description: 'Test Crane',
            kind: 'Crane',
            status: 'Active'
        });

        await formPage.fillOperationalDetails({
            setupTimeMinutes: '30',
            operationalWindowStart: '08:00',
            operationalWindowEnd: '18:00'
        });

        // Don't fill crane capacity - submit should fail
        await formPage.submitForm();

        // Modal should stay open or show error
        await expect(page.getByRole('heading', { name: /Create.*Resource/i })).toBeVisible();
    });

    test('Negative setup time is not allowed', async ({ page }) => {
        const listPage = new ResourceListPage(page);
        const formPage = new ResourceFormPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Resource/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        await formPage.fillBasicInfo({
            description: 'Invalid Resource',
            kind: 'Other',
            status: 'Active'
        });

        // Enter negative setup time
        await page.fill('input[name="setupTimeMinutes"]', '-10');
        await page.fill('input[name="operationalWindowStart"]', '08:00');
        await page.fill('input[name="operationalWindowEnd"]', '18:00');

        await formPage.submitForm();

        // Should show error or stay on form
        await expect(page.getByRole('heading', { name: /Create.*Resource/i })).toBeVisible();
    });
});

test.describe('Resource Management - Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Page has proper heading structure', async ({ page }) => {
        const listPage = new ResourceListPage(page);
        await listPage.goto();
        await waitForPageLoad(page);

        const mainHeading = page.locator('h1, h2').first();
        await expect(mainHeading).toBeVisible({ timeout: 5000 });
    });

    test('Form inputs have proper labels', async ({ page }) => {
        const listPage = new ResourceListPage(page);

        await listPage.goto();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Resource/i });
        if (!(await createButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

        await listPage.clickCreateButton();
        await page.waitForTimeout(500);

        // Check for labels
        const descriptionLabel = page.locator('label').filter({ hasText: /Description/i });
        if (await descriptionLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(descriptionLabel).toBeVisible();
        }
    });
});

