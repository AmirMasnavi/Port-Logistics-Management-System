import { Page, expect } from '@playwright/test';

/**
 * Page Object Model for Vessel Type List Page
 */
export class VesselTypeListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/vessel-types');
    await this.page.waitForLoadState('networkidle');
  }

  async clickCreateButton() {
    await this.page.getByRole('button', { name: /Create.*Vessel Type|Add.*Vessel Type/i }).click();
  }

  async searchByName(name: string) {
    const searchInput = this.page.getByPlaceholder(/Search/i);
    await searchInput.fill(name);
  }

  async clickEditButton(vesselTypeName: string) {
    // Find the card/row containing the vessel type name and click edit
    const card = this.page.locator(`text=${vesselTypeName}`).locator('..').locator('..');
    await card.getByRole('button', { name: /Edit/i }).click();
  }

  async clickDeleteButton(vesselTypeName: string) {
    const card = this.page.locator(`text=${vesselTypeName}`).locator('..').locator('..');
    await card.getByRole('button', { name: /Delete/i }).click();
  }

  async confirmDelete() {
    await this.page.getByRole('button', { name: /Confirm|Delete/i }).click();
  }

  async expectVesselTypeVisible(name: string) {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async expectVesselTypeNotVisible(name: string) {
    await expect(this.page.getByText(name)).not.toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.page.getByText(/No vessel types found/i)).toBeVisible();
  }
}

/**
 * Page Object Model for Vessel Type Create/Edit Form
 */
export class VesselTypeFormPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/vessel-types/new');
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: {
    name: string;
    description: string;
    capacity: string;
    maxRows: string;
    maxBays: string;
    maxTiers: string;
  }) {
    await this.page.fill('#name, input[name="name"]', data.name);
    await this.page.fill('#description, input[name="description"], textarea[name="description"]', data.description);
    await this.page.fill('#capacity, input[name="capacity"]', data.capacity);
    await this.page.fill('#maxRows, input[name="maxRows"]', data.maxRows);
    await this.page.fill('#maxBays, input[name="maxBays"]', data.maxBays);
    await this.page.fill('#maxTiers, input[name="maxTiers"]', data.maxTiers);
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
 * Test Data Factory for Vessel Types
 */
export class VesselTypeTestDataFactory {
  static createContainerShip(suffix: string = '') {
    return {
      name: `Container Ship ${suffix}${Date.now()}`,
      description: 'Large cargo container vessel for transoceanic shipping',
      capacity: '5000',
      maxRows: '10',
      maxBays: '20',
      maxTiers: '8'
    };
  }

  static createBulkCarrier(suffix: string = '') {
    return {
      name: `Bulk Carrier ${suffix}${Date.now()}`,
      description: 'Vessel designed for bulk cargo transport',
      capacity: '8000',
      maxRows: '12',
      maxBays: '24',
      maxTiers: '10'
    };
  }

  static createTanker(suffix: string = '') {
    return {
      name: `Oil Tanker ${suffix}${Date.now()}`,
      description: 'Large tanker for liquid cargo',
      capacity: '15000',
      maxRows: '1',
      maxBays: '1',
      maxTiers: '1'
    };
  }

  static createMinimalVessel() {
    return {
      name: `Minimal Vessel ${Date.now()}`,
      description: 'Test vessel with minimal configuration',
      capacity: '100',
      maxRows: '1',
      maxBays: '1',
      maxTiers: '1'
    };
  }

  static createInvalidVessel() {
    return {
      name: '', // Invalid: empty name
      description: 'Invalid vessel for testing validation',
      capacity: '-100', // Invalid: negative capacity
      maxRows: '0',
      maxBays: '0',
      maxTiers: '0'
    };
  }
}

