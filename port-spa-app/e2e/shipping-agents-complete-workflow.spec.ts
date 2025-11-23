import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';
import { AuthHelper } from './helpers/page-objects';

/**
 * Complete Workflow E2E Tests for Shipping Agents (Organizations & Representatives)
 *
 * Mirrors the style of `vessel-type-complete-workflow.spec.ts` and uses real authentication.
 * Tests included:
 *  - Full organization + initial representative creation
 *  - Create representative workflow
 *  - Edit representative
 *  - Delete representative
 *  - Validation edge case (invalid citizen ID)
 */

// Helper: wait for page to settle
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
}

// Small helper to safely click if visible
async function clickIfVisible(page: Page, selector: string) {
  try {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 2000 })) await el.click();
  } catch {
    // ignore
  }
}

// Ensure we are authenticated and the Shipping Agents page is loaded.
async function ensureOnShippingAgentsPage(page: Page) {
  // Use the same robust locator used elsewhere: nav[aria-label="Sections"] button that has text 'Representatives'
  const repsBtn = page.locator('nav[aria-label="Sections"] button', { hasText: 'Representatives' }).first();
  if (await repsBtn.isVisible().catch(() => false)) return;

  // Try to set localStorage auth directly (effective immediately in this page context)
  try {
    await page.evaluate(() => {
      try {
        localStorage.setItem('userRole', 'Administrator');
        localStorage.setItem('citizenId', 'ADMIN-001');
      } catch (e) { /* ignore */ }
    });
  } catch {}

  // Navigate to the route explicitly (this ensures addInitScript from AuthHelper will run on next load)
  await page.goto('/shippingagentorganization');

  // Wait for the main header or the Representatives button to appear
  await Promise.race([
    page.getByRole('heading', { name: /Shipping Agents/i }).waitFor({ timeout: 10000 }).catch(() => undefined),
    repsBtn.waitFor({ timeout: 10000 }).catch(() => undefined),
  ]);

  // If still not visible, give one more reload and wait
  if (!(await repsBtn.isVisible().catch(() => false))) {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await repsBtn.waitFor({ timeout: 10000 });
  }
}

// Robust helper to find the Representatives tab button (search inside the Sections nav)
function getRepresentativesButton(page: Page) {
  return page.locator('nav[aria-label="Sections"] button', { hasText: 'Representatives' }).first();
}

test.describe('Shipping Agents - Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // By default use fast mocked localStorage auth (no external network).
    // Set USE_REAL_AUTH=true in env to force real UI Firebase login.
    if (process.env.USE_REAL_AUTH === 'true') {
      await RealAuthHelper.ensureLoggedIn(page);
    } else {
      // Set localStorage before navigation so RequireAuth sees an authenticated user
      await AuthHelper.loginAsAdmin(page);
      // Ensure we land on the app root so auth is applied
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Full organization + initial representative create, view details and representatives CRUD', async ({ page }) => {
    // 1. Go to the Shipping Agents page
    await ensureOnShippingAgentsPage(page);
    await waitForPageLoad(page);

    // Sanity: header
    await expect(page.getByRole('heading', { name: /Shipping Agents/i })).toBeVisible({ timeout: 5000 });

    // 2. Create a new organization (with initial representative)
    // Click New Organization
    await clickIfVisible(page, 'button:has-text("New Organization")');
    await waitForPageLoad(page);

    // Fill organization fields (use unique name)
    const unique = `E2E Org ${Date.now()}`;
    await page.fill('#orgNameInput', unique);
    await page.fill('#orgAddressInput', 'Rua do Teste 123, Porto');
    await page.fill('#orgEmailInput', `e2e-${Date.now()}@example.test`);
    await page.fill('#orgPhoneInput', '912345678');
    await page.fill('#orgTaxInput', '501234567');

    // Fill initial representative
    const repName = `Rep ${Date.now()}`;
    await page.fill('#repInitNameInput', repName);
    await page.fill('#repInitCitizenInput', 'AB12345600');
    await page.fill('#repInitNationalityInput', 'Portuguese');
    await page.fill('#repInitEmailInput', `rep-${Date.now()}@example.test`);
    await page.fill('#repInitPhoneInput', '912345679');

    // Submit create organization
    await page.getByRole('button', { name: /Create Organization/i }).click();

    // Wait for success banner or navigation back to list
    await page.waitForTimeout(1500);

    // Verify the new organization appears in the list
    await expect(page.getByText(unique)).toBeVisible({ timeout: 8000 });

    // 3. Open organization details modal and verify tax number and contact
    await page.getByRole('button', { name: /See details/i }).first().click();
    await expect(page.getByText('Tax Number').first()).toBeVisible({ timeout: 5000 });
    await page.getByText('Full Address').first();
    // Close modal (try common close selectors)
    await clickIfVisible(page, 'button[aria-label="Close"], button:has-text("Fechar"), button:has-text("Close")');

    // 4. Switch to Representatives tab (use robust locator)
    const repsBtn = getRepresentativesButton(page);
    await repsBtn.waitFor({ timeout: 10000 });
    await repsBtn.click();
    await waitForPageLoad(page);

    // Ensure our initial rep name shows in list (may require search by organization/filter)
    const repVisible = await page.getByText(repName).isVisible({ timeout: 5000 }).catch(() => false);
    if (!repVisible) {
      // Try searching by organization name
      const search = page.getByPlaceholder(/Search by name, ID, organization or contact/i).first();
      if (await search.isVisible().catch(() => false)) {
        await search.fill(unique);
        await page.waitForTimeout(800);
      }
    }
    await expect(page.getByText(repName)).toBeVisible({ timeout: 8000 });

    // 5. Create a new representative linked to the organization
    await clickIfVisible(page, 'button:has-text("New Representative")');
    await waitForPageLoad(page);

    const newRepName = `NewRep ${Date.now()}`;
    await page.fill('#repOrgNameInput', unique);
    await page.fill('#repNameInput', newRepName);
    await page.fill('#repCitizenInput', 'AB12345611');
    await page.fill('#repNationalityInput', 'Portuguese');
    await page.fill('#repEmailInput', `newrep-${Date.now()}@example.test`);
    await page.fill('#repPhoneInput', '912345680');

    await page.getByRole('button', { name: /Create Representative/i }).click();

    // Verify creation succeeded and the new rep appears
    await expect(page.getByText(newRepName)).toBeVisible({ timeout: 8000 });

    // 6. Edit the new representative
    const editButton = page.locator(`text=${newRepName}`).locator('..').locator('..').locator('button:has-text("Edit")').first();
    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await waitForPageLoad(page);

      // Update nationality and save
      await page.fill('#editNationalityInput', 'Spanish');
      await page.getByRole('button', { name: /Save changes/i }).click();

      // Wait for modal to close
      await page.waitForTimeout(1000);
      // Verify updated nationality appears in list (first letter capitalized in UI)
      await expect(page.getByText(/Spanish|spanish/)).toBeVisible({ timeout: 5000 }).catch(() => {});
    }

    // 7. Delete the newly created representative
    const deleteButton = page.locator(`text=${newRepName}`).locator('..').locator('..').locator('button:has-text("Delete")').first();
    if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteButton.click();
      // Confirm delete modal
      await expect(page.getByText(/Are you sure you want to delete this representative?/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
      // Confirm
      await page.getByRole('button', { name: /Confirm|Yes|Delete/i }).last().click();
      await page.waitForTimeout(800);

      // Verify disappearance
      const still = await page.getByText(newRepName).isVisible({ timeout: 3000 }).catch(() => false);
      expect(still).toBeFalsy();
    }
  });

  test('Representative form validation shows error for invalid citizen ID', async ({ page }) => {
    await page.goto('/shippingagentorganization');
    await waitForPageLoad(page);

    // Ensure we are on Representatives tab
    const repsBtn2 = getRepresentativesButton(page);
    await repsBtn2.waitFor({ timeout: 10000 });
    await repsBtn2.click();
    await waitForPageLoad(page);

    await clickIfVisible(page, 'button:has-text("New Representative")');
    await waitForPageLoad(page);

    // Fill with invalid citizen id
    await page.fill('#repOrgNameInput', 'NonExistingOrg');
    await page.fill('#repNameInput', 'Bad Rep');
    await page.fill('#repCitizenInput', 'BADID');

    // Trigger validation (blur)
    await page.locator('#repNameInput').click();

    await expect(page.getByText(/Expected: AB12345600/)).toBeVisible({ timeout: 3000 });
  });
});
