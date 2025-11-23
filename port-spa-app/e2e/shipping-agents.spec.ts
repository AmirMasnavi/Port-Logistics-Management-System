import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuthHelper } from './helpers/page-objects';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const agents = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'agents.json'), 'utf-8'));

// Base URL used by the SPA in dev
const BASE = process.env.BASE_URL || 'http://localhost:5173';

// Helper to mock API endpoints used by the Shipping Agents page
async function mockShippingAgentEndpoints(page, options: { orgs?: any[]; reps?: any[]; status?: number } = {}) {
  const orgs = options.orgs ?? agents.orgs;
  const reps = options.reps ?? agents.reps;
  const status = options.status ?? 200;

  // Mock GET /ShippingAgentOrganizations
  await page.route('**/ShippingAgentOrganizations', async (route) => {
    if (status >= 400) {
      await route.fulfill({ status, body: JSON.stringify({ message: 'Server error' }), headers: { 'Content-Type': 'application/json' } });
    } else {
      await route.fulfill({ status: 200, body: JSON.stringify(orgs), headers: { 'Content-Type': 'application/json' } });
    }
  });

  // Mock GET /ShippingAgentRepresentatives
  await page.route('**/ShippingAgentRepresentatives', async (route) => {
    if (status >= 400) {
      await route.fulfill({ status, body: JSON.stringify({ message: 'Server error' }), headers: { 'Content-Type': 'application/json' } });
    } else {
      await route.fulfill({ status: 200, body: JSON.stringify(reps), headers: { 'Content-Type': 'application/json' } });
    }
  });

  // Mock POST endpoints to succeed and echo created entity
  await page.route('**/ShippingAgentOrganizations', async (route, request) => {
    if (request.method() === 'POST') {
      const body = await request.postDataJSON();
      const created = { id: 'o-new', ...body };
      await route.fulfill({ status: 201, body: JSON.stringify(created), headers: { 'Content-Type': 'application/json' } });
    } else {
      await route.continue();
    }
  });

  await page.route('**/ShippingAgentRepresentatives', async (route, request) => {
    if (request.method() === 'POST') {
      const body = await request.postDataJSON();
      const created = { id: 'r-new', ...body };
      await route.fulfill({ status: 201, body: JSON.stringify(created), headers: { 'Content-Type': 'application/json' } });
    } else {
      await route.continue();
    }
  });
}

test.describe('Shipping Agents - Organizations and Representatives', () => {
  test('Organizations: Happy path lists organizations and opens details modal', async ({ page }) => {
    // Mock auth and API before navigation so RequireAuth doesn't redirect and data is mocked
    await AuthHelper.loginAsAgent(page);
    await mockShippingAgentEndpoints(page);
    await page.goto(BASE + '/shippingagentorganization');
    await page.waitForLoadState('networkidle');

    // Ensure header present
    await expect(page.getByRole('heading', { name: 'Shipping Agents' })).toBeVisible();

    // Organizations tab should be active by default
    await expect(page.getByRole('button', { name: 'Organizations' })).toHaveClass(/border-b-4/);

    // Table should show organization name from fixture
    await expect(page.getByText(agents.orgs[0].name)).toBeVisible();

    // Click 'See details' and verify modal shows tax number
    await page.getByRole('button', { name: /See details/i }).click();
    await expect(page.getByText(agents.orgs[0].taxNumber)).toBeVisible();
  });

  test('Organizations: Empty list shows empty state', async ({ page }) => {
    await AuthHelper.loginAsAgent(page);
    await mockShippingAgentEndpoints(page, { orgs: [], reps: [] });
    await page.goto(BASE + '/shippingagentorganization');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('No organizations found')).toBeVisible();
  });

  test('Organizations: Server error displays error banner', async ({ page }) => {
    await AuthHelper.loginAsAgent(page);
    await mockShippingAgentEndpoints(page, { status: 500 });
    await page.goto(BASE + '/shippingagentorganization');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Server error|error/i)).toBeVisible();
  });

  test('Representatives: Happy path lists representatives and allows creating one', async ({ page }) => {
    await AuthHelper.loginAsAgent(page);
    await mockShippingAgentEndpoints(page);
    await page.goto(BASE + '/shippingagentorganization');
    await page.waitForLoadState('networkidle');

    // Switch to Representatives tab
    await page.getByRole('button', { name: 'Representatives' }).click();
    await expect(page.getByText(agents.reps[0].name)).toBeVisible();

    // Click New Representative
    await page.getByRole('button', { name: 'New Representative' }).click();

    // Fill form fields using IDs from the page
    await page.fill('#repOrgNameInput', agents.orgs[0].name);
    await page.fill('#repNameInput', 'Test Rep');
    await page.fill('#repCitizenInput', 'AB12345611');
    await page.fill('#repNationalityInput', 'Portuguese');
    await page.fill('#repEmailInput', 'test.rep@example.com');
    await page.fill('#repPhoneInput', '912345679');

    // Submit
    await page.getByRole('button', { name: /Create Representative/i }).click();

    // After creation the new representative should appear in the list (mock echoes it)
    await expect(page.getByText('Test Rep')).toBeVisible();
  });

  test('Representatives: Validation error shows inline message for invalid citizen ID', async ({ page }) => {
    await AuthHelper.loginAsAgent(page);
    await mockShippingAgentEndpoints(page);
    await page.goto(BASE + '/shippingagentorganization');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Representatives' }).click();
    await page.getByRole('button', { name: 'New Representative' }).click();

    await page.fill('#repOrgNameInput', agents.orgs[0].name);
    await page.fill('#repNameInput', 'Bad Rep');
    await page.fill('#repCitizenInput', 'BADID');

    // Blurring the field should trigger validation
    await page.locator('#repNameInput').click();

    await expect(page.getByText(/Expected: AB12345600/)).toBeVisible();
  });
});
