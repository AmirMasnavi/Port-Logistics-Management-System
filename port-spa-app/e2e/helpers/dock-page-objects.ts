import { Page, expect } from '@playwright/test';

/**
 * Page Object Model for Dock List Page
 */
export class DockListPage {
    constructor(private page: Page) {}

    async goto() {
        await this.page.goto('/docks');
        await this.page.waitForLoadState('networkidle');
    }

    async clickCreateButton() {
        await this.page.getByRole('button', { name: /Create.*Dock|Add.*Dock/i }).click();
    }

    async searchByName(name: string) {
        const searchInput = this.page.getByPlaceholder(/Search/i);
        await searchInput.fill(name);
        // Press Enter to trigger search and wait for network idle so results update
        await searchInput.press('Enter');
        await this.page.waitForLoadState('networkidle');
    }
    
    async clickEditButton(dockName: string) {
        // Find the card/row containing the vessel type name and click edit
        const card = this.page.locator(`text=${dockName}`).locator('..').locator('..');
        await card.getByRole('button', { name: /Edit/i }).click();
    }

    async clickDeleteButton(dockName: string) {
        const card = this.page.locator(`text=${dockName}`).locator('..').locator('..');
        await card.getByRole('button', { name: /Delete/i }).click();
    }

    async confirmDelete() {
        await this.page.getByRole('button', { name: /Confirm|Delete/i }).click();
    }

    async expectDockVisible(name: string) {
        await expect(this.page.getByText(name)).toBeVisible();
    }

    async expectDockNotVisible(name: string) {
        await expect(this.page.getByText(name)).not.toBeVisible();
    }

    async expectEmptyState() {
        await expect(this.page.getByText(/No docks found/i)).toBeVisible();
    }
}

/**
 * Page Object Model for Dock Create/Edit Form
 */
export class DockFormPage {
    constructor(private page: Page) {}

    async goto() {
        await this.page.goto('/docks/new');
        await this.page.waitForLoadState('networkidle');
    }

    async fillForm(data: {
        name: string;
        locationZone: string;
        locationSection: string;
        lengthInMeters: string;
        depthInMeters: string;
        maxDraftInMeters: string;
        numberOfSTSCranes: string;
    }) {
        await this.page.fill('input[name="name"]', data.name);
        await this.page.fill('input[name="locationZone"]', data.locationZone);
        await this.page.fill('input[name="locationSection"]', data.locationSection);
        await this.page.fill('input[name="lengthInMeters"]', data.lengthInMeters);
        await this.page.fill('input[name="depthInMeters"]', data.depthInMeters);
        await this.page.fill('input[name="maxDraftInMeters"]', data.maxDraftInMeters);
        await this.page.fill('input[name="numberOfSTSCranes"]', data.numberOfSTSCranes);
    }

    async submitForm() {
        await this.page.getByRole('button', { name: /Create|Save|Submit/i }).click();
    }

    async clickCancel() {
        await this.page.getByRole('button', { name: /Cancel/i }).click();
    }

    async expectValidationError(fieldName: string) {
        // Check for HTML5 validation or error messages
        const field = this.page.locator(`#${fieldName}, input[name="${fieldName}"]`);
        await expect(field).toHaveAttribute('aria-invalid', 'true');
    }

    async expectFormVisible() {
        await expect(this.page.getByRole('heading', { name: /Create.*Vessel Type|Edit.*Vessel Type/i }))
            .toBeVisible();
    }
}

/**
 * Test Data Factory for Docks
 */
export class DockTestDataFactory {
    static createContainerShip(suffix: string = '') {
        return {
            name: `Standard Dock ${suffix}${Date.now()}`,
            locationZone: `Zone ${suffix}`,
            locationSection: 'Sec A',
            lengthInMeters: '400',
            depthInMeters: '20',
            maxDraftInMeters: '18',
            numberOfSTSCranes: '4'
        };
    }

    static createSmallDock(suffix: string = '') {
        return {
            name: `Small Pier ${suffix}${Date.now()}`,
            locationZone: 'Marina',
            locationSection: 'M1',
            lengthInMeters: '50',
            depthInMeters: '5',
            maxDraftInMeters: '4',
            numberOfSTSCranes: '0'
        };
    }

    static createLargeTerminal(suffix: string = '') {
        return {
            name: `Mega Terminal ${suffix}${Date.now()}`,
            locationZone: 'Deep Sea',
            locationSection: 'DS-1',
            lengthInMeters: '1000',
            depthInMeters: '25',
            maxDraftInMeters: '22',
            numberOfSTSCranes: '10'
        };
    }
    static createInvalidDock() {
        return {
            name: '', // Invalid: empty name
            locationZone: '',
            locationSection: '',
            lengthInMeters: '-100', // Invalid: negative
            depthInMeters: '0',
            maxDraftInMeters: '0',
            numberOfSTSCranes: '-1'
        };
    }
}