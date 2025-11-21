import { Page, expect } from '@playwright/test';

/**
 * Page Object Model for Vessel Visit Notification
 * 
 * This file contains reusable page objects and helper methods
 * to make tests more maintainable and readable.
 */

export class VesselVisitListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/vessel-visits');
    await this.page.waitForLoadState('networkidle');
  }

  async clickCreateVisit() {
    // Button text is "+ Create Visit" not just "Create Visit"
    await this.page.locator('a:has-text("+ Create Visit"), a:has-text("Create Visit")').first().click();
  }

  async searchByImo(imo: string) {
    const searchInput = this.page.getByPlaceholder(/Search by vessel name or IMO/i);
    await searchInput.fill(imo);
  }

  async filterByStatus(status: string) {
    const filterSelect = this.page.locator('select').first();
    await filterSelect.selectOption(status);
  }

  async getStatValue(statName: string): Promise<string> {
    const statCard = this.page.locator(`text=${statName}`).locator('..').locator('..');
    return await statCard.locator('div').first().innerText();
  }

  async expectSuccessMessage(message: string) {
    await expect(this.page.getByText(new RegExp(message, 'i'))).toBeVisible();
  }

  async clickApproveOnFirstCard() {
    await this.page.locator('button:has-text("Approve")').first().click();
  }

  async clickRejectOnFirstCard() {
    await this.page.locator('button:has-text("Reject")').first().click();
  }

  async clickSubmitOnFirstCard() {
    await this.page.locator('button:has-text("Submit")').first().click();
  }

  async clickViewDetailsOnFirstCard() {
    await this.page.locator('button:has-text("View")').first().click();
  }
}

export class VesselVisitCreatePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/vessel-visits/new');
    await this.page.waitForLoadState('networkidle');
  }

  // Step 1: Visit Details
  async fillVesselDetails(imo: string, arrival: string, departure: string) {
    await this.page.fill('#vesselImo', imo);
    await this.page.fill('#estimatedArrival', arrival);
    await this.page.fill('#estimatedDeparture', departure);
  }

  async goToNextStep() {
    await this.page.getByRole('button', { name: /Next/i }).click();
  }

  async goToPreviousStep() {
    await this.page.getByRole('button', { name: /Back/i }).click();
  }

  // Step 2: Cargo Details
  async fillCargoDetails(description: string, weight: string) {
    await this.page.fill('#description', description);
    await this.page.fill('#weight', weight);
  }

  async addContainer(code: string, position: string) {
    await this.page.getByRole('button', { name: /Add Container/i }).click();
    
    // Fill the last container (the one just added)
    const containers = this.page.locator('input[name="containerCode"]');
    const count = await containers.count();
    await containers.nth(count - 1).fill(code);
    
    const positions = this.page.locator('input[name="position"]');
    await positions.nth(count - 1).fill(position);
  }

  async removeLastContainer() {
    const deleteButtons = this.page.locator('button:has-text("Remove"), button:has(svg)').filter({ hasText: '' });
    const count = await deleteButtons.count();
    if (count > 0) {
      await deleteButtons.nth(count - 1).click();
    }
  }

  // Step 3: Crew Details
  async addCrewMember(name: string, nationality: string, isSafetyOfficer: boolean = false) {
    await this.page.getByRole('button', { name: /Add Crew Member/i }).click();
    
    // Fill the last crew member (the one just added)
    const nameInputs = this.page.locator('input[name="name"]');
    const count = await nameInputs.count();
    await nameInputs.nth(count - 1).fill(name);
    
    const nationalityInputs = this.page.locator('input[name="nationality"]');
    await nationalityInputs.nth(count - 1).fill(nationality);
    
    if (isSafetyOfficer) {
      const checkboxes = this.page.locator('input[name="isSafetyOfficer"]');
      await checkboxes.nth(count - 1).check();
    }
  }

  async submitForm() {
    await this.page.getByRole('button', { name: /Create Notification/i }).click();
  }

  async updateForm() {
    await this.page.getByRole('button', { name: /Save Changes/i }).click();
  }

  async cancel() {
    await this.page.getByRole('button', { name: /Cancel/i }).click();
  }

  async expectOnStep(stepNumber: number) {
    const stepNames = ['Visit Details', 'Cargo', 'Crew'];
    await expect(this.page.getByText(stepNames[stepNumber - 1])).toBeVisible();
  }
}

export class VvnDecisionModal {
  constructor(private page: Page) {}

  async expectApprovalFormVisible() {
    await expect(this.page.getByText(/Approval Form/i)).toBeVisible();
  }

  async expectRejectionFormVisible() {
    await expect(this.page.getByText(/Rejection Form/i)).toBeVisible();
  }

  async fillDockName(dockName: string) {
    await this.page.fill('input[id="dockName"]', dockName);
  }

  async fillRejectionReason(reason: string) {
    await this.page.fill('textarea[id="reason"]', reason);
  }

  async confirmApproval() {
    await this.page.getByRole('button', { name: /Confirm Approval/i }).click();
  }

  async confirmRejection() {
    await this.page.getByRole('button', { name: /Confirm Rejection/i }).click();
  }

  async cancel() {
    await this.page.getByRole('button', { name: /Cancel/i }).click();
  }

  async expectVesselImoDisplayed(imo: string) {
    await expect(this.page.getByText(imo)).toBeVisible();
  }
}

export class VvnDetailsModal {
  constructor(private page: Page) {}

  async expectVisible() {
    await expect(this.page.getByText(/Vessel:/i)).toBeVisible();
  }

  async expectVesselImo(imo: string) {
    await expect(this.page.getByText(imo)).toBeVisible();
  }

  async expectCargoDescription(description: string) {
    await expect(this.page.getByText(description)).toBeVisible();
  }

  async close() {
    // Look for close button (X) or Cancel button
    const closeButton = this.page.locator('button[aria-label="Close"], button:has-text("Close")').first();
    await closeButton.click();
  }
}

export class ConfirmationModal {
  constructor(private page: Page) {}

  async expectVisible(title: string) {
    await expect(this.page.getByText(new RegExp(title, 'i'))).toBeVisible();
  }

  async confirm() {
    // Click the last button with confirmation text (to avoid clicking navigation buttons)
    await this.page.getByRole('button', { name: /Submit|Confirm|Reopen/i }).last().click();
  }

  async cancel() {
    await this.page.getByRole('button', { name: /Cancel/i }).click();
  }
}

/**
 * Test Data Factory
 * Generates realistic test data for vessel visits
 */
export class TestDataFactory {
  static createVesselVisit(overrides?: Partial<typeof defaultData>) {
    const defaultData = {
      vesselImo: `IMO${Date.now()}`,
      estimatedArrival: '2025-12-01T10:00',
      estimatedDeparture: '2025-12-05T16:00',
      cargoDescription: 'Electronic equipment and machinery parts',
      cargoWeight: '50000',
      containers: [
        { code: 'CSQU3054383', position: 'B1-R1-T1' },
        { code: 'MSCU4567890', position: 'B1-R2-T1' },
      ],
      crew: [
        { name: 'John Doe', nationality: 'Portuguese', isSafetyOfficer: true },
        { name: 'Jane Smith', nationality: 'Spanish', isSafetyOfficer: false },
      ],
    };

    return { ...defaultData, ...overrides };
  }

  static createApprovalData(dockName: string = 'Dock A') {
    return {
      officerId: 'OFFICER-001',
      dockName,
    };
  }

  static createRejectionData(reason: string = 'Missing required documentation') {
    return {
      officerId: 'OFFICER-001',
      reason,
    };
  }
}

/**
 * Authentication Helper
 * Mocks authentication for different user roles
 */
export class AuthHelper {
  static async loginAsAgent(page: Page, citizenId: string = 'AC1234567') {
    await page.addInitScript((data) => {
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('citizenId', data.citizenId);
    }, { role: 'ShippingAgentRepresentative', citizenId });
  }

  static async loginAsOfficer(page: Page, citizenId: string = 'OFFICER-001') {
    await page.addInitScript((data) => {
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('citizenId', data.citizenId);
    }, { role: 'PortAuthorityOfficer', citizenId });
  }

  static async loginAsAdmin(page: Page, citizenId: string = 'ADMIN-001') {
    await page.addInitScript((data) => {
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('citizenId', data.citizenId);
    }, { role: 'Administrator', citizenId });
  }
}
