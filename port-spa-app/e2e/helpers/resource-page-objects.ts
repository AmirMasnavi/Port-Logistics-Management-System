import { Page, expect } from '@playwright/test';

/**
 * Page Object Model for Resource List Page
 */
export class ResourceListPage {
    constructor(private page: Page) {}

    async goto() {
        await this.page.goto('/resources');
        await this.page.waitForLoadState('networkidle');
    }

    async clickCreateButton() {
        await this.page.getByRole('button', { name: /Create.*Resource|Add.*Resource|\+ Create Resource/i }).click();
    }

    async searchByDescription(description: string) {
        const searchInput = this.page.getByPlaceholder(/Search/i);
        await searchInput.fill(description);
        await this.page.waitForTimeout(500);
    }

    async filterByKind(kind: 'Crane' | 'Truck' | 'Other' | '') {
        const kindSelect = this.page.locator('select[name="filterKind"]');
        if (await kindSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await kindSelect.selectOption(kind);
        }
    }

    async filterByStatus(status: 'Active' | 'Inactive' | 'UnderMaintenance' | '') {
        const statusSelect = this.page.locator('select[name="filterStatus"]');
        if (await statusSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await statusSelect.selectOption(status);
        }
    }

    async clickEditButton(resourceDescription: string) {
        const card = this.page.locator(`text=${resourceDescription}`).locator('xpath=ancestor::div[contains(@class, "shadow")]');
        await card.getByRole('button', { name: /Edit/i }).click();
    }

    async clickUpdateStatusButton(resourceDescription: string) {
        const card = this.page.locator(`text=${resourceDescription}`).locator('xpath=ancestor::div[contains(@class, "shadow")]');
        await card.getByRole('button', { name: /Update Status|Change Status/i }).click();
    }

    async expectResourceVisible(description: string) {
        await expect(this.page.getByText(description)).toBeVisible();
    }

    async expectResourceNotVisible(description: string) {
        await expect(this.page.getByText(description)).not.toBeVisible();
    }

    async expectEmptyState() {
        await expect(this.page.getByText(/No resources found/i)).toBeVisible();
    }

    async getStatCardValue(label: string): Promise<string> {
        const card = this.page.locator('.bg-white').filter({ hasText: label });
        const value = await card.locator('p').first().textContent();
        return value || '0';
    }
}

/**
 * Page Object Model for Resource Create/Edit Form
 */
export class ResourceFormPage {
    constructor(private page: Page) {}

    async fillBasicInfo(data: {
        description: string;
        kind: 'Crane' | 'Truck' | 'Other';
        status: 'Active' | 'Inactive' | 'UnderMaintenance';
        assignedArea?: string;
    }) {
        await this.page.fill('input[name="description"]', data.description);
        await this.page.selectOption('select[name="kind"]', data.kind);
        await this.page.selectOption('select[name="status"]', data.status);
        
        if (data.assignedArea) {
            const areaSelect = this.page.locator('select[name="assignedArea"]');
            if (await areaSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
                await areaSelect.selectOption(data.assignedArea);
            }
        }
    }

    async fillOperationalDetails(data: {
        setupTimeMinutes: string;
        operationalWindowStart: string;
        operationalWindowEnd: string;
        qualificationRequirements?: string;
    }) {
        await this.page.fill('input[name="setupTimeMinutes"]', data.setupTimeMinutes);
        await this.page.fill('input[name="operationalWindowStart"]', data.operationalWindowStart);
        await this.page.fill('input[name="operationalWindowEnd"]', data.operationalWindowEnd);
        
        if (data.qualificationRequirements) {
            await this.page.fill('textarea[name="qualificationRequirementsText"], input[name="qualificationRequirementsText"]', 
                data.qualificationRequirements);
        }
    }

    async fillCraneCapacity(averageContainersPerHour: string) {
        await this.page.fill('input[name="averageContainersPerHour"]', averageContainersPerHour);
    }

    async fillTruckCapacity(data: {
        containersPerTrip: string;
        averageSpeedKmh: string;
    }) {
        await this.page.fill('input[name="containersPerTrip"]', data.containersPerTrip);
        await this.page.fill('input[name="averageSpeedKmh"]', data.averageSpeedKmh);
    }

    async fillOtherCapacity(data: {
        otherUnit: string;
        otherGenericValue: string;
    }) {
        await this.page.fill('input[name="otherUnit"]', data.otherUnit);
        await this.page.fill('input[name="otherGenericValue"]', data.otherGenericValue);
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
 * Page Object Model for Resource Status Update Modal
 */
export class ResourceStatusModal {
    constructor(private page: Page) {}

    async selectStatus(status: 'Active' | 'Inactive' | 'UnderMaintenance') {
        await this.page.selectOption('select[name="newStatus"]', status);
    }

    async confirmUpdate() {
        await this.page.getByRole('button', { name: /Update|Confirm/i }).click();
    }

    async cancel() {
        await this.page.getByRole('button', { name: /Cancel/i }).click();
    }
}

/**
 * Test Data Factory for Resources
 */
export class ResourceTestDataFactory {
    static createCrane(suffix: string) {
        return {
            description: `Crane ${suffix}`,
            kind: 'Crane' as const,
            status: 'Active' as const,
            setupTimeMinutes: '30',
            operationalWindowStart: '08:00',
            operationalWindowEnd: '18:00',
            qualificationRequirements: 'Crane Operator License, Safety Training',
            averageContainersPerHour: '25'
        };
    }

    static createTruck(suffix: string) {
        return {
            description: `Truck ${suffix}`,
            kind: 'Truck' as const,
            status: 'Active' as const,
            setupTimeMinutes: '15',
            operationalWindowStart: '06:00',
            operationalWindowEnd: '22:00',
            qualificationRequirements: 'Commercial Driver License',
            containersPerTrip: '2',
            averageSpeedKmh: '40'
        };
    }

    static createOther(suffix: string) {
        return {
            description: `Equipment ${suffix}`,
            kind: 'Other' as const,
            status: 'Active' as const,
            setupTimeMinutes: '10',
            operationalWindowStart: '07:00',
            operationalWindowEnd: '19:00',
            qualificationRequirements: 'Basic Training',
            otherUnit: 'Units/Hour',
            otherGenericValue: '50'
        };
    }
}
