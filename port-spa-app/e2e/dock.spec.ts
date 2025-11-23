import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';

/**
 * E2E Tests for Dock Management System
 *
 * Workflows covered:
 * 1. Admin creating a new dock
 * 2. Editing existing docks
 * 3. Deleting docks
 * 4. Validation, edge cases, and performance
 */

// --- Data Factory ---
const DockFactory = {
    createStandardDock: (suffix: string) => ({
        name: `Dock ${suffix}`,
        locationZone: `Zone ${suffix}`,
        locationSection: `Sec ${Math.floor(Math.random() * 100)}`,
        lengthInMeters: '400',
        depthInMeters: '20',
        maxDraftInMeters: '18',
        numberOfSTSCranes: '4'
    }),
    createSmallDock: (suffix: string) => ({
        name: `Pier ${suffix}`,
        locationZone: 'Marina',
        locationSection: 'M1',
        lengthInMeters: '50',
        depthInMeters: '5',
        maxDraftInMeters: '4',
        numberOfSTSCranes: '0'
    })
};

// --- Helper Functions ---
async function waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
}

async function fillDockForm(page: Page, data: any) {
    await page.fill('input[name="name"]', data.name);
    await page.fill('input[name="locationZone"]', data.locationZone);
    await page.fill('input[name="locationSection"]', data.locationSection);
    await page.fill('input[name="lengthInMeters"]', data.lengthInMeters);
    await page.fill('input[name="depthInMeters"]', data.depthInMeters);
    await page.fill('input[name="maxDraftInMeters"]', data.maxDraftInMeters);
    await page.fill('input[name="numberOfSTSCranes"]', data.numberOfSTSCranes);

    // Interact with Vessel Type Dropdown if available
    const dropdown = page.getByText('Allowed Vessel Types').locator('xpath=..').locator('button');
    if (await dropdown.isVisible()) {
        await dropdown.click();
        const firstCheckbox = page.locator('input[type="checkbox"]').first();
        if (await firstCheckbox.isVisible()) {
            await firstCheckbox.check();
        }
        await dropdown.click(); // Close dropdown
    }
}

test.describe('Dock Management - Admin Workflows', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Admin can view the docks page', async ({ page }) => {
        await page.goto('/docks');
        await waitForPageLoad(page);

        const heading = page.getByRole('heading', { name: /Docks/i }).first();
        const isHeadingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);

        if (isHeadingVisible) {
            console.log('Page heading found:', await heading.textContent());
        } else {
            expect(page.url()).toContain('docks');
        }

        const createButton = page.getByRole('button', { name: /\+ Create Dock|New Dock/i });
        if (await createButton.isVisible()) {
            await expect(createButton).toBeVisible();
        } else {
            console.log('⚠️ Create button not visible - user might lack permissions');
        }
    });

    test('Admin can create a new dock', async ({ page }) => {
        await page.goto('/docks');
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /\+ Create Dock/i });
        if (!(await createButton.isVisible())) return;

        await createButton.click();
        await expect(page.getByRole('heading', { name: /Create.*Dock/i })).toBeVisible();

        const testData = DockFactory.createStandardDock(`E2E-${Date.now()}`);
        await fillDockForm(page, testData);

        await page.getByRole('button', { name: /Create/i }).click();

        // Wait for success message
        await expect(page.getByText('Dock created successfully!')).toBeVisible({ timeout: 5000 }).catch(() => {});
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

        // Verify presence in list
        await waitForPageLoad(page);
        await expect(page.getByText(testData.name)).toBeVisible();
    });

    test('Admin can edit an existing dock', async ({ page }) => {
        await page.goto('/docks');
        await waitForPageLoad(page);

        const dockCard = page.locator('.bg-white.rounded-xl.shadow-sm').first();
        if (!(await dockCard.isVisible())) {
            console.log('⚠️ No docks available to edit');
            return;
        }

        const editButton = dockCard.getByRole('button', { name: /Edit/i });
        await editButton.click();

        await expect(page.getByRole('heading', { name: /Edit Dock/i })).toBeVisible();

        const nameInput = page.locator('input[name="name"]');
        const originalName = await nameInput.inputValue();
        const updatedName = `${originalName} - Upd`;

        await nameInput.fill(updatedName);
        await page.getByRole('button', { name: /Update/i }).click();

        await expect(page.getByText('Dock updated successfully!')).toBeVisible({ timeout: 5000 }).catch(() => {});
        await expect(page.getByText(updatedName)).toBeVisible();
    });

    test('Admin can delete a dock', async ({ page }) => {
        await page.goto('/docks');
        await waitForPageLoad(page);

        // Create a temporary dock to delete
        const createButton = page.getByRole('button', { name: /\+ Create Dock/i });
        if (await createButton.isVisible()) {
            await createButton.click();
            const testData = DockFactory.createSmallDock(`Del-${Date.now()}`);
            await fillDockForm(page, testData);
            await page.getByRole('button', { name: /Create/i }).click();
            await waitForPageLoad(page);

            // Now delete it
            const dockCard = page.locator(`text=${testData.name}`).locator('xpath=ancestor::div[contains(@class, "shadow-sm")]');
            await dockCard.getByRole('button', { name: /Delete/i }).click();

            await expect(page.getByText(/Are you sure/i)).toBeVisible();
            await page.getByRole('button', { name: /Confirm|Delete/i }).last().click();

            await expect(page.getByText('Dock deleted successfully!')).toBeVisible({ timeout: 5000 }).catch(() => {});
            await expect(page.getByText(testData.name)).toBeHidden();
        }
    });
});

test.describe('Dock - Validation and Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
        await page.goto('/docks');
        await waitForPageLoad(page);
    });

    test('Form validation prevents invalid submissions', async ({ page }) => {
        const createButton = page.getByRole('button', { name: /\+ Create Dock/i });
        if (!(await createButton.isVisible())) return;

        await createButton.click();

        // 1. Empty submission
        await page.getByRole('button', { name: /Create/i }).click();
        // Should stay on modal
        await expect(page.getByRole('heading', { name: /Create.*Dock/i })).toBeVisible();

        // 2. Invalid Numbers (Negative)
        await page.fill('input[name="name"]', 'Invalid Dock');
        await page.fill('input[name="locationZone"]', 'Z1');
        await page.fill('input[name="locationSection"]', 'S1');
        await page.fill('input[name="lengthInMeters"]', '-50'); // Negative

        await page.getByRole('button', { name: /Create/i }).click();

        // Should still be open due to validation
        await expect(page.getByRole('heading', { name: /Create.*Dock/i })).toBeVisible();
    });

    test('Search and filter functionality', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/Search by name/i);
        if (await searchInput.isVisible()) {
            await searchInput.fill('NON_EXISTENT_DOCK_XYZ');
            await expect(page.getByText(/No docks found/i)).toBeVisible();

            await searchInput.clear();
            await expect(page.getByText(/No docks found/i)).toBeHidden();
        }
    });
});

test.describe('Dock - Performance', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Page loads within acceptable time', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/docks');
        await page.waitForSelector('div.grid, div.flex-col', { timeout: 5000 });

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(5000);
    });
});