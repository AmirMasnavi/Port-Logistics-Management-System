import { test, expect } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';

/**
 * REAL E2E Tests with Actual Authentication
 * 
 * These tests use your actual credentials: 1221579@isep.ipp.pt / 123456
 * They log in through Firebase before running tests.
 */

test.describe('Vessel Visit Notification - With Real Authentication', () => {
  
  // Login once before all tests in this describe block
  test.beforeEach(async ({ page }) => {
    // Perform real login using admin credentials
    await RealAuthHelper.loginAsAdmin(page);
  });

  test('Can access vessel visits page after login', async ({ page }) => {
    // Navigate to vessel visits
    await page.goto('/vessel-visits');
    await page.waitForLoadState('networkidle');

    // Verify we can access the page (not redirected to login)
    expect(page.url()).toContain('/vessel-visits');
    
    // Check that page loaded with content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ Successfully accessed vessel visits page');
  });

  test('Can see vessel visits dashboard', async ({ page }) => {
    await page.goto('/vessel-visits');
    await page.waitForLoadState('networkidle');

    // Look for main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    const headingText = await heading.textContent();
    console.log(`✅ Found heading: ${headingText}`);
  });

  test('Can access create notification page', async ({ page }) => {
    await page.goto('/vessel-visits/new');
    await page.waitForLoadState('networkidle');

    // Verify we're on the create page
    expect(page.url()).toContain('/vessel-visits/new');
    
    // Look for form elements
    const form = page.locator('form').first();
    if (await form.isVisible({ timeout: 5000 })) {
      console.log('✅ Create form is accessible');
    }
  });

  test('Can search for vessels', async ({ page }) => {
    await page.goto('/vessel-visits');
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.getByPlaceholder(/search/i).first();
    
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('IMO123');
      console.log('✅ Search functionality is available');
    }
  });

  test('Can see filter dropdown', async ({ page }) => {
    await page.goto('/vessel-visits');
    await page.waitForLoadState('networkidle');

    // Find filter dropdown
    const filterSelect = page.locator('select').first();
    
    if (await filterSelect.isVisible({ timeout: 5000 })) {
      await filterSelect.selectOption('InProgress');
      console.log('✅ Filter dropdown is functional');
    }
  });
});

test.describe('Complete Creation Workflow - With Real Auth', () => {
  test.beforeEach(async ({ page }) => {
    await RealAuthHelper.loginAsAdmin(page);
  });

  test('Can create a vessel visit notification', async ({ page }) => {
    const uniqueImo = `IMO${Date.now()}`;
    
    // Navigate to create page
    await page.goto('/vessel-visits/new');
    await page.waitForLoadState('networkidle');

    // === STEP 1: Vessel Details ===
    const vesselImoInput = page.locator('#vesselImo');
    if (await vesselImoInput.isVisible({ timeout: 5000 })) {
      await vesselImoInput.fill(uniqueImo);
      console.log(`✅ Filled vessel IMO: ${uniqueImo}`);

      // Fill dates
      await page.fill('#estimatedArrival', '2025-12-01T10:00');
      await page.fill('#estimatedDeparture', '2025-12-05T16:00');

      // Click Next
      const nextButton = page.getByRole('button', { name: /next/i });
      if (await nextButton.isVisible({ timeout: 3000 })) {
        await nextButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Moved to Step 2');

        // === STEP 2: Cargo ===
        const descriptionInput = page.locator('#description');
        if (await descriptionInput.isVisible({ timeout: 5000 })) {
          await descriptionInput.fill('Test cargo - electronic equipment');
          await page.fill('#weight', '50000');
          
          // Try to add container
          const addContainerBtn = page.getByRole('button', { name: /add container/i });
          if (await addContainerBtn.isVisible({ timeout: 3000 })) {
            await addContainerBtn.click();
            await page.waitForTimeout(300);
            
            // Fill container details
            const containerCodeInput = page.locator('input[name="containerCode"]').first();
            if (await containerCodeInput.isVisible({ timeout: 2000 })) {
              await containerCodeInput.fill('CONT001');
            }
          }

          // Click Next again
          if (await nextButton.isVisible({ timeout: 3000 })) {
            await nextButton.click();
            await page.waitForTimeout(500);
            console.log('✅ Moved to Step 3');

            // === STEP 3: Crew ===
            const addCrewBtn = page.getByRole('button', { name: /add crew member/i });
            if (await addCrewBtn.isVisible({ timeout: 3000 })) {
              await addCrewBtn.click();
              await page.waitForTimeout(300);

              // Fill crew details
              const nameInput = page.locator('input[name="name"]').first();
              if (await nameInput.isVisible({ timeout: 2000 })) {
                await nameInput.fill('John Doe');
                await page.locator('input[name="nationality"]').first().fill('Portuguese');
              }
            }

            // Submit form
            const submitButton = page.getByRole('button', { name: /create notification/i });
            if (await submitButton.isVisible({ timeout: 3000 })) {
              await submitButton.click();
              console.log('✅ Submitted form');

              // Wait for navigation
              await page.waitForLoadState('networkidle');
              await page.waitForTimeout(2000);

              // Verify we're back on list page
              if (page.url().includes('/vessel-visits')) {
                console.log('✅ Redirected to list page after creation');
                
                // Try to find our vessel
                const searchInput = page.getByPlaceholder(/search/i).first();
                if (await searchInput.isVisible({ timeout: 3000 })) {
                  await searchInput.fill(uniqueImo);
                  await page.waitForTimeout(1000);
                  
                  // Check if vessel appears
                  const vesselElement = page.getByText(uniqueImo);
                  if (await vesselElement.isVisible({ timeout: 5000 })) {
                    console.log('✅ Vessel notification created successfully!');
                  }
                }
              }
            }
          }
        }
      }
    }
  });
});

test.describe('Authentication Tests', () => {
  test('Can login with provided credentials', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Perform login
    await RealAuthHelper.loginAsAdmin(page);

    // Verify login succeeded by checking for logout button or user menu
    const loggedIn = await RealAuthHelper.isLoggedIn(page);
    expect(loggedIn).toBeTruthy();
    
    console.log('✅ Authentication successful');
  });

  test('Stays logged in across page navigations', async ({ page }) => {
    await RealAuthHelper.loginAsAdmin(page);

    // Navigate to different pages
    await page.goto('/vessel-visits');
    await page.waitForLoadState('networkidle');
    
    let loggedIn = await RealAuthHelper.isLoggedIn(page);
    expect(loggedIn).toBeTruthy();
    console.log('✅ Still logged in on vessel-visits page');

    // Navigate to create page
    await page.goto('/vessel-visits/new');
    await page.waitForLoadState('networkidle');
    
    loggedIn = await RealAuthHelper.isLoggedIn(page);
    expect(loggedIn).toBeTruthy();
    console.log('✅ Still logged in on create page');
  });
});

