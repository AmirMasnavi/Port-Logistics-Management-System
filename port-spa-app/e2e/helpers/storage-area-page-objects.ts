import { Page, expect } from '@playwright/test';

/**
 * Page Object Model for Storage Area List Page
 */
export class StorageAreaListPage {
    constructor(private page: Page) {}

    async goto() {
        await this.page.goto('/port-facilities');
        await this.page.waitForLoadState('networkidle');
    }

    async clickCreateButton() {
        await this.page.getByRole('button', { name: /Create.*Storage Area|Add.*Storage Area|\+ Create Storage Area/i }).click();
    }

    async searchByLocation(location: string) {
        const searchInput = this.page.getByPlaceholder(/Search/i);
        await searchInput.fill(location);
        await this.page.waitForTimeout(500);
    }

    async filterByType(type: 'Yard' | 'Warehouse' | 'ContainerYard' | '') {
        const typeSelect = this.page.locator('select[name="filterType"]');
        if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await typeSelect.selectOption(type);
        }
    }

    async clickEditButton(storageLocation: string) {
        const card = this.page.locator(`text=${storageLocation}`).locator('xpath=ancestor::div[contains(@class, "shadow")]');
        await card.getByRole('button', { name: /Edit/i }).click();
    }

    async clickDeleteButton(storageLocation: string) {
        const card = this.page.locator(`text=${storageLocation}`).locator('xpath=ancestor::div[contains(@class, "shadow")]');
        await card.getByRole('button', { name: /Delete/i }).click();
    }

    async confirmDelete() {
        await this.page.getByRole('button', { name: /Confirm|Delete/i }).last().click();
    }

    async expectStorageAreaVisible(location: string) {
        await expect(this.page.getByText(location)).toBeVisible();
    }

    async expectStorageAreaNotVisible(location: string) {
        await expect(this.page.getByText(location)).not.toBeVisible();
    }

    async expectEmptyState() {
        await expect(this.page.getByText(/No storage areas found/i)).toBeVisible();
    }

    async getStatCardValue(label: string): Promise<string> {
        const card = this.page.locator('.bg-white').filter({ hasText: label });
        const value = await card.locator('p').first().textContent();
        return value || '0';
    }
}

/**
 * Page Object Model for Storage Area Create/Edit Form
 */
export class StorageAreaFormPage {
    constructor(private page: Page) {}

    async fillForm(data: {
        type: 'Yard' | 'Warehouse' | 'ContainerYard';
        location: string;
        capacity: string;
        currentOccupancy: string;
    }) {
        await this.page.selectOption('select[name="type"]', data.type);
        await this.page.fill('input[name="location"]', data.location);
        await this.page.fill('input[name="capacity"]', data.capacity);
        await this.page.fill('input[name="currentOccupancy"]', data.currentOccupancy);
    }

    async submitForm() {
        await this.page.getByRole('button', { name: /Create|Save|Submit/i }).click();
    }

    async clickCancel() {
        await this.page.getByRole('button', { name: /Cancel/i }).click();
    }

    async expectFormVisible(title: string) {
        await expect(this.page.getByRole('heading', { name: new RegExp(title, 'i') }))
            .toBeVisible({ timeout: 5000 });
    }

    async expectErrorMessage(message: string) {
        await expect(this.page.getByText(new RegExp(message, 'i'))).toBeVisible();
    }
}

/**
 * Test Data Factory for Storage Areas
 */
export class StorageAreaTestDataFactory {
    static createYard(suffix: string) {
        return {
            type: 'Yard' as const,
            location: `Yard-${suffix}`,
            capacity: '1000',
            currentOccupancy: '250'
        };
    }

    static createWarehouse(suffix: string) {
        return {
            type: 'Warehouse' as const,
            location: `WH-${suffix}`,
            capacity: '500',
            currentOccupancy: '100'
        };
    }

    static createContainerYard(suffix: string) {
        return {
            type: 'ContainerYard' as const,
            location: `CY-${suffix}`,
            capacity: '2000',
            currentOccupancy: '800'
        };
    }

    static createEmptyYard(suffix: string) {
        return {
            type: 'Yard' as const,
            location: `Empty-${suffix}`,
            capacity: '100',
            currentOccupancy: '0'
        };
    }

    static createFullWarehouse(suffix: string) {
        return {
            type: 'Warehouse' as const,
            location: `Full-WH-${suffix}`,
            capacity: '100',
            currentOccupancy: '100'
        };
    }
}
