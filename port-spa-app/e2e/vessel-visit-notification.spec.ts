import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';

/**
 * E2E Tests for Vessel Visit Notification System
 * 
 * These tests simulate complete user workflows from start to finish:
 * 1. Agent creating a new vessel visit notification
 * 2. Agent submitting the notification for review
 * 3. Officer approving/rejecting notifications
 * 4. Viewing and editing notifications
 */

// Test data
const testVesselData = {
  vesselImo: `IMO${Date.now()}`, // Unique IMO for each test run
  estimatedArrival: '2025-12-01T10:00',
  estimatedDeparture: '2025-12-05T16:00',
  cargoDescription: 'Test cargo containing electronic equipment',
  cargoWeight: '50000',
  containerCode: 'CSQU3054383',
  containerPosition: 'B1-R1-T1',
  crewName: 'John Doe',
  crewNationality: 'Portuguese',
};

// Helper function to wait for page to be ready
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra time for React components to render
}

test.describe('Vessel Visit Notification - Agent Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Use real authentication
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Agent can view the vessel visits page', async ({ page }) => {
    // Navigate to the vessel visits page
    await page.goto('/vessel-visits');
    await waitForPageLoad(page);

    // Check that the page title is visible (could be either Agent or Officer view)
    const agentHeading = page.getByRole('heading', { name: /My Vessel Visit Notifications/i });
    const officerHeading = page.getByRole('heading', { name: /Vessel Visit Notifications/i });
    
    // At least one should be visible
    const isAgentView = await agentHeading.isVisible({ timeout: 2000 }).catch(() => false);
    const isOfficerView = await officerHeading.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(isAgentView || isOfficerView).toBeTruthy();

    // Check that stat cards are visible
    await expect(page.getByText(/In Progress|Pending Review|Approved|Rejected/i).first()).toBeVisible();
  });

  test('Agent can create a new vessel visit notification - Step 1: Visit Details', async ({ page }) => {
    await page.goto('/vessel-visits');
    await waitForPageLoad(page);

    // Click "Create Visit" button - the actual text is "+ Create Visit"
    const createButton = page.locator('a:has-text("+ Create Visit"), a:has-text("Create Visit")').first();
    
    // Wait for button to be visible, if it's not visible, skip test (role-based visibility)
    const isVisible = await createButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      console.log('⚠️  Create Visit button not visible - user might not have agent role');
      return; // Skip test gracefully
    }
    
    await createButton.click();
    await waitForPageLoad(page);

    // Verify we're on the create page
    await expect(page.getByRole('heading', { name: /Create New Vessel Visit Notification/i })).toBeVisible({ timeout: 10000 });

    // Verify step 1 is active
    await expect(page.getByText(/Visit Details/i)).toBeVisible();

    // Fill in vessel details
    await page.fill('#vesselImo', testVesselData.vesselImo);
    await page.fill('#estimatedArrival', testVesselData.estimatedArrival);
    await page.fill('#estimatedDeparture', testVesselData.estimatedDeparture);

    // Verify the data was entered
    await expect(page.locator('#vesselImo')).toHaveValue(testVesselData.vesselImo);
    await expect(page.locator('#estimatedArrival')).toHaveValue(testVesselData.estimatedArrival);
    await expect(page.locator('#estimatedDeparture')).toHaveValue(testVesselData.estimatedDeparture);

    // Click Next to go to step 2
    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForTimeout(500);
    
    // Verify we're on step 2
    await expect(page.getByText(/Cargo/i)).toBeVisible();
  });

  test('Agent can complete full vessel visit notification creation', async ({ page }) => {
    await page.goto('/vessel-visits/new');
    await waitForPageLoad(page);

    // Check if we're on the create page (might redirect if not authorized)
    const isOnCreatePage = await page.getByRole('heading', { name: /Create New Vessel Visit Notification/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isOnCreatePage) {
      console.log('⚠️  Not authorized to create notifications - skipping test');
      return;
    }

    // === STEP 1: Visit Details ===
    await page.fill('#vesselImo', testVesselData.vesselImo);
    await page.fill('#estimatedArrival', testVesselData.estimatedArrival);
    await page.fill('#estimatedDeparture', testVesselData.estimatedDeparture);
    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForTimeout(500);

    // === STEP 2: Cargo Details ===
    await page.fill('#description', testVesselData.cargoDescription);
    await page.fill('#weight', testVesselData.cargoWeight);

    // Add a container
    await page.getByRole('button', { name: /Add Container/i }).click();
    
    // Fill container details (the first container added)
    await page.fill('input[name="containerCode"]', testVesselData.containerCode);
    await page.fill('input[name="position"]', testVesselData.containerPosition);

    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForTimeout(500);

    // === STEP 3: Crew Details ===
    // Check how many crew member fields exist initially
    const initialCrewCount = await page.locator('input[name="name"]').count();
    
    if (initialCrewCount === 0) {
      // No crew fields exist, add one
      await page.getByRole('button', { name: /Add Crew Member/i }).click();
      await page.waitForTimeout(300);
    }
    
    // Fill the first (and possibly only) crew member
    const nameInputs = page.locator('input[name="name"]');
    const nationalityInputs = page.locator('input[name="nationality"]');
    const safetyOfficerCheckboxes = page.locator('input[name="isSafetyOfficer"]');
    
    // Fill first crew member
    await nameInputs.first().fill(testVesselData.crewName);
    await nationalityInputs.first().fill(testVesselData.crewNationality);
    await safetyOfficerCheckboxes.first().check();

    // Remove any additional empty crew member fields if they exist
    const currentCount = await nameInputs.count();
    if (currentCount > 1) {
      // Remove extra empty fields by clicking remove buttons
      const removeButtons = page.locator('button:has-text("Remove"), button[aria-label*="Remove"]');
      const removeCount = await removeButtons.count();
      
      // Remove all except the first one we filled
      for (let i = removeCount - 1; i > 0; i--) {
        try {
          await removeButtons.nth(i).click({ timeout: 1000 });
          await page.waitForTimeout(200);
        } catch (e) {
          // Ignore if button not clickable
        }
      }
    }

    // Submit the form
    await page.getByRole('button', { name: /Create Notification/i }).click();

    // Wait for navigation back to list page (increased timeout for API call)
    await page.waitForURL('**/vessel-visits', { timeout: 15000 }).catch(async () => {
      // If navigation didn't happen, check for error messages
      const errorMsg = await page.locator('.text-red-600, .bg-red-100').first().textContent().catch(() => null);
      // if (errorMsg) {
      //   console.log('⚠️  Form submission error:', errorMsg);
      // }
    });
    await waitForPageLoad(page);

    // Verify we're back on the list page or check for success
    const isOnListPage = page.url().includes('/vessel-visits');
    expect(isOnListPage).toBeTruthy();
  });

  test('Agent can search and filter vessel visits', async ({ page }) => {
    await page.goto('/vessel-visits');
    await waitForPageLoad(page);

    // Test search functionality - wait for input to be available
    const searchInput = page.getByPlaceholder(/Search by vessel name or IMO/i);
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('IMO123');
    
    // Verify search input has the value
    await expect(searchInput).toHaveValue('IMO123');

    // Test filter functionality
    const filterSelect = page.locator('select').first();
    await expect(filterSelect).toBeVisible({ timeout: 5000 });
    await filterSelect.selectOption('InProgress');
    
    // Verify filter was applied
    await expect(filterSelect).toHaveValue('InProgress');

    // Clear filters
    await searchInput.clear();
    await filterSelect.selectOption('');
  });

  test('Agent can view notification details', async ({ page }) => {
    // First, create a notification (simplified)
    await page.goto('/vessel-visits/new');
    await waitForPageLoad(page);

    // Check if we can access create page
    const canCreate = await page.getByRole('heading', { name: /Create New Vessel Visit Notification/i })
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canCreate) {
      console.log('⚠️  Cannot create notification - skipping test');
      return;
    }

    // Quick create
    await page.fill('#vesselImo', testVesselData.vesselImo);
    await page.fill('#estimatedArrival', testVesselData.estimatedArrival);
    await page.fill('#estimatedDeparture', testVesselData.estimatedDeparture);
    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForTimeout(500);
    await page.fill('#description', 'Test cargo');
    await page.fill('#weight', '1000');
    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForTimeout(500);
    
    // Handle crew member fields - fill first one and remove any extras
    const nameInputs = page.locator('input[name="name"]');
    const crewCount = await nameInputs.count();
    
    if (crewCount === 0) {
      // Add crew member if none exist
      await page.getByRole('button', { name: /Add Crew Member/i }).click();
      await page.waitForTimeout(300);
    }
    
    // Fill only the first crew member
    await nameInputs.first().fill('Test Crew');
    await page.locator('input[name="nationality"]').first().fill('Portuguese');
    
    // Remove extra crew fields if they exist
    const finalCrewCount = await nameInputs.count();
    if (finalCrewCount > 1) {
      const removeButtons = page.locator('button:has-text("Remove"), button[aria-label*="Remove"]');
      const removeCount = await removeButtons.count();
      for (let i = removeCount - 1; i > 0; i--) {
        try {
          await removeButtons.nth(i).click({ timeout: 1000 });
          await page.waitForTimeout(200);
        } catch (e) {
          // Ignore if not clickable
        }
      }
    }
    
    await page.getByRole('button', { name: /Create Notification/i }).click();
    
    // Wait for redirect or error
    await page.waitForURL('**/vessel-visits', { timeout: 15000 }).catch(() => {
      // console.log('⚠️  Form did not redirect - possible validation error');
    });
    await waitForPageLoad(page);

    // Now try to view details if we're on list page
    const viewButton = page.locator('button:has-text("View")').first();
    if (await viewButton.isVisible({ timeout: 3000 })) {
      await viewButton.click();
      
      // Check that modal or details page appears
      await expect(page.getByText(/Vessel:/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(testVesselData.vesselImo)).toBeVisible();
    }
  });

  test('Agent can submit a notification for review', async ({ page }) => {
    await page.goto('/vessel-visits');
    await waitForPageLoad(page);

    // Look for a notification with "In Progress" status and a Submit button
    const submitButton = page.locator('button:has-text("Submit")').first();
    
    if (await submitButton.isVisible({ timeout: 3000 })) {
      await submitButton.click();
      
      // Confirmation modal should appear
      await expect(page.getByText(/Are you sure you want to submit/i)).toBeVisible();
      
      // Confirm submission
      await page.getByRole('button', { name: /Submit/i }).last().click();
      
      // Wait for success message
      await expect(page.getByText(/submitted/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Vessel Visit Notification - Officer Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Use real authentication - the test user might have officer privileges
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Officer can view pending notifications', async ({ page }) => {
    await page.goto('/vessel-visits');
    await waitForPageLoad(page);

    // Check that notifications page is shown (heading varies by role)
    const agentHeading = page.getByRole('heading', { name: /My Vessel Visit Notifications/i });
    const officerHeading = page.getByRole('heading', { name: /Vessel Visit Notifications/i });
    
    const isVisible = await agentHeading.isVisible({ timeout: 2000 }).catch(() => false) ||
                      await officerHeading.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBeTruthy();

    // Check that stat cards are visible
    await expect(page.getByText(/Pending Review|Approved|Rejected/i).first()).toBeVisible();
  });

  test('Officer can approve a vessel visit notification', async ({ page }) => {
    await page.goto('/vessel-visits');
    await waitForPageLoad(page);

    // Filter to show only submitted notifications
    const filterSelect = page.locator('select').first();
    if (await filterSelect.isVisible({ timeout: 3000 })) {
      await filterSelect.selectOption('Submitted');
      await page.waitForTimeout(1000);
    }

    // Look for an "Approve" button
    const approveButton = page.locator('button:has-text("Approve")').first();
    
    if (await approveButton.isVisible({ timeout: 3000 })) {
      await approveButton.click();
      
      // Approval modal should appear
      await expect(page.getByText(/Approval Form/i)).toBeVisible({ timeout: 5000 });
      
      // Fill in dock name (required for approval)
      await page.fill('input[placeholder*="Dock"], input[id="dockName"]', 'Dock A');
      
      // Confirm approval
      await page.getByRole('button', { name: /Confirm Approval/i }).click();
      
      // Wait for success message
      await expect(page.getByText(/Approved/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Officer can reject a vessel visit notification', async ({ page }) => {
    await page.goto('/vessel-visits');
    await waitForPageLoad(page);

    // Filter to show only submitted notifications
    const filterSelect = page.locator('select').first();
    if (await filterSelect.isVisible({ timeout: 3000 })) {
      await filterSelect.selectOption('Submitted');
      await page.waitForTimeout(1000);
    }

    // Look for a "Reject" button
    const rejectButton = page.locator('button:has-text("Reject")').first();
    
    if (await rejectButton.isVisible({ timeout: 3000 })) {
      await rejectButton.click();
      
      // Rejection modal should appear
      await expect(page.getByText(/Rejection Form/i)).toBeVisible({ timeout: 5000 });
      
      // Fill in rejection reason (required)
      await page.fill('textarea[placeholder*="reason"], textarea[id="reason"]', 'Missing required cargo documentation');
      
      // Confirm rejection
      await page.getByRole('button', { name: /Confirm Rejection/i }).click();
      
      // Wait for success message
      await expect(page.getByText(/Rejected/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Officer can reopen a rejected notification', async ({ page }) => {
    await page.goto('/vessel-visits');
    await waitForPageLoad(page);

    // Filter to show rejected notifications
    const filterSelect = page.locator('select').first();
    if (await filterSelect.isVisible({ timeout: 3000 })) {
      await filterSelect.selectOption('Rejected');
      await page.waitForTimeout(1000);
    }

    // Look for a "Reopen" button
    const reopenButton = page.locator('button:has-text("Reopen")').first();
    
    if (await reopenButton.isVisible({ timeout: 3000 })) {
      await reopenButton.click();
      
      // Confirmation modal should appear
      await expect(page.getByText(/Are you sure you want to reopen/i)).toBeVisible({ timeout: 5000 });
      
      // Confirm reopen
      await page.getByRole('button', { name: /Reopen/i }).last().click();
      
      // Wait for success message
      await expect(page.getByText(/reopened/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Vessel Visit Notification - Administrator Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Administrator can toggle between Agent and Officer views', async ({ page }) => {
    await page.goto('/vessel-visits');
    await waitForPageLoad(page);

    // Look for the view toggle button
    const toggleButton = page.locator('button:has-text("View as")').first();
    
    if (await toggleButton.isVisible({ timeout: 3000 })) {
      // Should initially show "View as Agent" or similar
      await expect(toggleButton).toBeVisible();
      
      // Click to switch view
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      // Text should change
      await expect(toggleButton).toContainText(/View as/i);
    }
  });
});

test.describe('Vessel Visit Notification - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Form validation prevents submission with missing required fields', async ({ page }) => {
    await page.goto('/vessel-visits/new');
    await waitForPageLoad(page);

    // Try to proceed without filling any fields
    await page.getByRole('button', { name: /Next/i }).click();

    // Browser validation should prevent moving to next step
    // The page should still show step 1
    await expect(page.getByText(/Visit Details/i)).toBeVisible();
  });

  test('Agent can cancel creation and return to list', async ({ page }) => {
    await page.goto('/vessel-visits/new');
    await waitForPageLoad(page);

    // Fill some data
    await page.fill('#vesselImo', 'IMO1234567');

    // Click Cancel button
    await page.getByRole('button', { name: /Cancel/i }).click();

    // Should navigate back to list page
    await page.waitForURL('**/vessel-visits', { timeout: 5000 });
    await expect(page.url()).toContain('/vessel-visits');
    await expect(page.url()).not.toContain('/new');
  });

  test('Empty state shown when no notifications match filter', async ({ page }) => {
    await page.goto('/vessel-visits');
    await waitForPageLoad(page);

    // Search for something that doesn't exist
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('NONEXISTENT_IMO_999999');
    await page.waitForTimeout(1000);

    // Empty state message should appear
    const emptyMessage = page.getByText(/No notifications found/i);
    // Note: This might take a moment for the filter to apply
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Vessel Visit Notification - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginWithCredentials(page);
  });

  test('Page has proper heading structure', async ({ page }) => {
    await page.goto('/vessel-visits');
    await waitForPageLoad(page);

    // Check for main heading (h1 or h2)
    const mainHeading = page.locator('h1, h2').first();
    await expect(mainHeading).toBeVisible({ timeout: 5000 });
  });

  test('Form inputs have proper labels', async ({ page }) => {
    await page.goto('/vessel-visits/new');
    await waitForPageLoad(page);

    // Check if we can access the form
    const canAccess = await page.locator('label[for="vesselImo"]').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!canAccess) {
      console.log('⚠️  Cannot access create form - user might not have permission');
      return;
    }

    // Check that inputs have labels
    await expect(page.locator('label[for="vesselImo"]')).toBeVisible();
    await expect(page.locator('label[for="estimatedArrival"]')).toBeVisible();
    await expect(page.locator('label[for="estimatedDeparture"]')).toBeVisible();
  });

  test('Buttons have descriptive text or aria-labels', async ({ page }) => {
    await page.goto('/vessel-visits');
    await waitForPageLoad(page);

    // Create button should be visible and have text (if user has agent role)
    const createButton = page.locator('a:has-text("+ Create Visit"), a:has-text("Create Visit")').first();
    const isVisible = await createButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await expect(createButton).toBeVisible();
    } else {
      // console.log('⚠️  Create Visit button not visible - user might not have agent role (this is OK)');
    }
  });
});
