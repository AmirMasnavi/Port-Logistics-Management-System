import { Page, expect } from '@playwright/test';

/**
 * Page Object Model for Vessel List Page
 */
export class VesselListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/vessels');
    await this.page.waitForLoadState('networkidle');
  }

  async clickCreateButton() {
    await this.page.getByRole('button', { name: /Create.*Vessel|Add.*Vessel|New/i }).click();
  }

  async searchByName(name: string) {
    const searchInput = this.page.getByPlaceholder(/Search/i);
    await searchInput.fill(name);
  }

  async clickEditButton(vesselName: string) {
    const card = this.page.locator(`text=${vesselName}`).locator('..').locator('..');
    await card.getByRole('button', { name: /Edit/i }).click();
  }

  async clickDeleteButton(vesselName: string) {
    const card = this.page.locator(`text=${vesselName}`).locator('..').locator('..');
    await card.getByRole('button', { name: /Delete/i }).click();
  }

  async confirmDelete() {
    await this.page.getByRole('button', { name: /Confirm|Delete|Yes/i }).click();
  }

  async expectVesselVisible(name: string) {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async expectVesselNotVisible(name: string) {
    await expect(this.page.getByText(name)).not.toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.page.getByText(/No vessels found/i)).toBeVisible();
  }
}

/**
 * Page Object Model for Vessel Create/Edit Form
 */
export class VesselFormPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/vessels/new');
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: {
    imoNumber: string;
    name: string;
    operator: string;
    callSign?: string;
    mmsi?: string;
    length?: string;
    beam?: string;
    draft?: string;
    capacity?: string;
    vesselType?: string;
  }) {
    // Fill required fields
    await this.page.fill('#imoNumber, input[name="imoNumber"]', data.imoNumber);
    await this.page.fill('#name, input[name="name"]', data.name);
    await this.page.fill('#operator, input[name="operator"]', data.operator);

    // Fill optional fields if provided
    if (data.callSign) {
      await this.page.fill('#callSign, input[name="callSign"]', data.callSign);
    }
    if (data.mmsi) {
      await this.page.fill('#mmsi, input[name="mmsi"]', data.mmsi);
    }
    if (data.length) {
      await this.page.fill('#length, input[name="length"]', data.length);
    }
    if (data.beam) {
      await this.page.fill('#beam, input[name="beam"]', data.beam);
    }
    if (data.draft) {
      await this.page.fill('#draft, input[name="draft"]', data.draft);
    }
    if (data.capacity) {
      await this.page.fill('#capacity, input[name="capacity"]', data.capacity);
    }
    if (data.vesselType) {
      const typeSelect = this.page.locator('#vesselType, select[name="vesselType"]');
      if (await typeSelect.isVisible().catch(() => false)) {
        await typeSelect.selectOption(data.vesselType);
      }
    }
  }

  async submitForm() {
    await this.page.getByRole('button', { name: /Create|Save|Submit/i }).click();
  }

  async clickCancel() {
    await this.page.getByRole('button', { name: /Cancel/i }).click();
  }

  async expectValidationError(fieldName: string) {
    const field = this.page.locator(`#${fieldName}, input[name="${fieldName}"]`);
    const isInvalid = await field.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  }

  async expectFormVisible() {
    await expect(this.page.getByRole('heading', { name: /Create.*Vessel|Edit.*Vessel/i }))
      .toBeVisible({ timeout: 5000 });
  }
}

/**
 * Test Data Factory for Vessels
 */
export class VesselTestDataFactory {
  private static counter = 0;

  /**
   * Generate a unique timestamp-based ID
   */
  private static getUniqueId(): string {
    this.counter++;
    return `${Date.now()}${this.counter}`;
  }

  /**
   * Create a cargo vessel test data
   */
  static createCargoVessel(prefix: string = 'Test') {
    const uniqueId = this.getUniqueId();
    return {
      imoNumber: `IMO${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: `${prefix} Cargo Ship ${uniqueId}`,
      operator: `${prefix} Cargo Operator`,
      callSign: `CG${uniqueId.slice(-6)}`,
      mmsi: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      length: '250',
      beam: '40',
      draft: '12',
      capacity: '50000',
      vesselType: 'Cargo'
    };
  }

  /**
   * Create a container vessel test data
   */
  static createContainerVessel(prefix: string = 'Test') {
    const uniqueId = this.getUniqueId();
    return {
      imoNumber: `IMO${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: `${prefix} Container Ship ${uniqueId}`,
      operator: `${prefix} Container Lines`,
      callSign: `CN${uniqueId.slice(-6)}`,
      mmsi: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      length: '350',
      beam: '48',
      draft: '14',
      capacity: '18000',
      vesselType: 'Container'
    };
  }

  /**
   * Create a bulk carrier test data
   */
  static createBulkCarrier(prefix: string = 'Test') {
    const uniqueId = this.getUniqueId();
    return {
      imoNumber: `IMO${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: `${prefix} Bulk Carrier ${uniqueId}`,
      operator: `${prefix} Bulk Shipping`,
      callSign: `BK${uniqueId.slice(-6)}`,
      mmsi: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      length: '280',
      beam: '45',
      draft: '15',
      capacity: '75000',
      vesselType: 'Bulk Carrier'
    };
  }

  /**
   * Create a tanker vessel test data
   */
  static createTanker(prefix: string = 'Test') {
    const uniqueId = this.getUniqueId();
    return {
      imoNumber: `IMO${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: `${prefix} Tanker ${uniqueId}`,
      operator: `${prefix} Tanker Operations`,
      callSign: `TK${uniqueId.slice(-6)}`,
      mmsi: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      length: '300',
      beam: '50',
      draft: '16',
      capacity: '100000',
      vesselType: 'Tanker'
    };
  }

  /**
   * Create vessel with special characters in name
   */
  static createVesselWithSpecialChars() {
    const uniqueId = this.getUniqueId();
    return {
      imoNumber: `IMO${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: `Spëcîål Vëssël & Co. #${uniqueId}`,
      operator: `Operator with "Quotes" & Special <Chars>`,
      callSign: `SP${uniqueId.slice(-6)}`,
      mmsi: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      length: '200',
      beam: '35',
      draft: '10',
      capacity: '30000'
    };
  }

  /**
   * Create minimal vessel (only required fields)
   */
  static createMinimalVessel(prefix: string = 'Minimal') {
    const uniqueId = this.getUniqueId();
    return {
      imoNumber: `IMO${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: `${prefix} Vessel ${uniqueId}`,
      operator: `${prefix} Operator`
    };
  }

  /**
   * Create vessel with maximum field lengths
   */
  static createMaxFieldLengthVessel() {
    const uniqueId = this.getUniqueId();
    return {
      imoNumber: `IMO${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: `Very Long Vessel Name That Tests Maximum Length Constraints ${uniqueId}`,
      operator: 'Extremely Long Operator Company Name That Tests Database Field Constraints',
      callSign: `LONGCALL${uniqueId.slice(-4)}`,
      mmsi: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      length: '999999',
      beam: '999999',
      draft: '999999',
      capacity: '999999999'
    };
  }
}

