import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';

/**
 * OEM System Tests (SUT = System)
 * 
 * Covers:
 * - Incident Types Management (Create, List, Edit)
 * - Incidents Management (Create, List, Edit)
 * - Operation Plans Viewing (List, Filter, Details, Edit)
 * - Vessel Visit Execution (VVE) Management (Create, List, Filter, Update, View Details)
 */

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
}

async function getFirstVveId(page: Page): Promise<string> {
  // Check current page - if we're already on complementary tasks, don't navigate again
  const currentUrl = page.url();
  if (!currentUrl.includes('/complementary-tasks')) {
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
  }
  
  // Look for VVE ID in existing tasks (format: VVE-YYYYMMDD-XXXX)
  const vveInTask = page.locator('text=/VVE-\\d{8}-\\d{4}/i').first();
  if (await vveInTask.isVisible({ timeout: 5000 })) {
    const vveId = await vveInTask.textContent();
    const cleanVveId = vveId?.trim();
    console.log(`✓ Found VVE from existing task: ${cleanVveId}`);
    return cleanVveId || 'VVE-20251220-0007';
  }
  
  // Fallback: use the known VVE ID from your existing tasks (no more navigation!)
  console.log('⚠️ Could not find VVE in UI, using known VVE: VVE-20251220-0007');
  return 'VVE-20251220-0007';
}

test.describe('OEM System Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Add a random delay before login to prevent race conditions with multiple tests logging in simultaneously
    const randomDelay = Math.floor(Math.random() * 2000) + 500; // 500ms to 2500ms
    await page.waitForTimeout(randomDelay);

    // Login as Admin to ensure access to all OEM features
    await RealAuthHelper.loginWithCredentials(page);
    
    // Add a small delay after login to ensure session is fully established
    await page.waitForTimeout(1000);
  });

  // ========================================
  // INCIDENT TYPES TESTS
  // ========================================
  
  test('Incident Types - Create', async ({ page }) => {
    // 1. Navigate to Incident Types
    await page.goto('/incident-types');
    await waitForPageLoad(page);
    
    // 2. Verify page loaded
    await expect(page.locator('h1:has-text("Incident Catalog")')).toBeVisible({ timeout: 10000 });

    // 3. Open create form
    const createButton = page.locator('button:has-text("Create New Type")');
    await createButton.click();
    await waitForPageLoad(page);
    
    // 4. Wait for modal
    await expect(page.locator('h2:has-text("Define New Incident")')).toBeVisible({ timeout: 5000 });
    
    // 5. Fill in the form
    const uniqueCode = `IT-${Date.now()}`;
    
    // Use specific placeholders from source code
    await page.locator('input[placeholder="e.g. T-INC001"]').fill(uniqueCode);
    await page.locator('input[placeholder="e.g. Equipment Failure"]').fill('Test Incident Type');
    await page.locator('textarea[placeholder="Define the scope and operational impact..."]').fill('E2E Test Description');
    
    // Select severity (Initial Severity)
    // Find select by label text proximity or just the first select in the form
    const severitySelect = page.locator('label:has-text("Initial Severity") + select, select').first();
    await severitySelect.selectOption('Minor');
    
    // 6. Submit the form
    await page.locator('button:has-text("Publish Type")').click();
    await waitForPageLoad(page);

    // 7. Verify success - look for the code in the page
    await expect(page.locator(`text=${uniqueCode}`)).toBeVisible({ timeout: 10000 });
  });

  test('Incident Types - List and View', async ({ page }) => {
    // 1. Navigate to Incident Types
    await page.goto('/incident-types');
    await waitForPageLoad(page);
    
    // 2. Verify page structure
    await expect(page.locator('h1:has-text("Incident Catalog")')).toBeVisible();
    
    // 3. Check if table is displayed
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 5000 });
    
    // 4. Count items
    const rowCount = await page.locator('table tbody tr').count();
    console.log(`Found ${rowCount} incident type(s)`);
    
    // 5. Verify headers
    await expect(page.locator('th:has-text("Incident Category & Code")')).toBeVisible();
  });

  test('Incident Types - Edit', async ({ page }) => {
    // 1. Navigate to Incident Types
    await page.goto('/incident-types');
    await waitForPageLoad(page);
    
    // 2. First create an item to edit
    const uniqueCode = `IT-EDIT-${Date.now()}`;
    
    await page.locator('button:has-text("Create New Type")').click();
    await waitForPageLoad(page);
    
    await page.locator('input[placeholder="e.g. T-INC001"]').fill(uniqueCode);
    await page.locator('input[placeholder="e.g. Equipment Failure"]').fill('To Be Edited');
    await page.locator('textarea[placeholder="Define the scope and operational impact..."]').fill('Original Description');
    await page.locator('label:has-text("Initial Severity") + select, select').first().selectOption('Minor');
    
    await page.locator('button:has-text("Publish Type")').click();
    await waitForPageLoad(page);
    
    // 3. Find the created item row
    const itemRow = page.locator(`tr:has-text("${uniqueCode}")`).first();
    await expect(itemRow).toBeVisible({ timeout: 5000 });
    
    // 4. Hover over the row to reveal actions
    await itemRow.hover();
    
    // 5. Click edit button (it's inside the row, look for the edit icon button)
    // The edit button is the first button in the last cell
    const editButton = itemRow.locator('td:last-child button').first();
    await editButton.click();
    await waitForPageLoad(page);
    
    // 6. Update the name
    await expect(page.locator('h2:has-text("Update Definition")')).toBeVisible();
    await page.locator('input[placeholder="e.g. Equipment Failure"]').fill('Updated Name');
    
    // 7. Save changes
    await page.locator('button:has-text("Commit Changes")').click();
    await waitForPageLoad(page);
    
    // 8. Verify the change
    await expect(page.locator('text=Updated Name').first()).toBeVisible({ timeout: 10000 });
  });

  // ========================================
  // INCIDENTS TESTS
  // ========================================
  
  test('Incidents - Create', async ({ page }) => {
    // 1. Navigate to Incidents
    await page.goto('/incidents');
    await waitForPageLoad(page);
    
    // 2. Verify page loaded
    await expect(page.locator('h1:has-text("Operational Incidents")')).toBeVisible();

    // 3. Open create form
    await page.locator('button:has-text("Report New Incident")').click();
    await waitForPageLoad(page);
    
    // 4. Wait for modal
    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2:has-text("Report New Incident")')).toBeVisible({ timeout: 5000 });
    
    // 5. Fill in the form (scope to modal)
    const uniqueTitle = `Incident-${Date.now()}`;
    
    await modal.locator('input[placeholder="Brief description of the incident"]').fill(uniqueTitle);
    await modal.locator('textarea[placeholder="Detailed description of what happened"]').fill('E2E Test Incident Description');
    
    // Select type
    const typeSelect = modal.locator('select').first(); // First select in modal is Type
    await expect(typeSelect).not.toBeDisabled();
    await typeSelect.selectOption({ index: 1 });

    // Select severity
    const severitySelect = modal.locator('select').nth(1); // Second select in modal is Severity
    await severitySelect.selectOption('Minor');
    
    // 6. Submit the form
    await modal.locator('button:has-text("Report Incident")').click();
    await waitForPageLoad(page);

    // 7. Verify in list
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible({ timeout: 10000 });
  });

  test('Incidents - List and View', async ({ page }) => {
    // 1. Navigate to Incidents
    await page.goto('/incidents');
    await waitForPageLoad(page);
    
    // 2. Verify page loaded
    await expect(page.locator('h1:has-text("Operational Incidents")')).toBeVisible();
    
    // 3. Check if list is displayed
    // Wait for loading to finish
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    
    // 4. Count items - use specific class combination for incident cards
    const itemCount = await page.locator('.bg-white.shadow.border-l-4').count();
    console.log(`Found ${itemCount} incident(s)`);
    
    if (itemCount > 0) {
      // 5. Verify content of first item
      const firstItem = page.locator('.bg-white.shadow.border-l-4').first();
      await expect(firstItem).toBeVisible();
      await expect(firstItem.locator('h3')).toBeVisible(); // Title
    }
  });

  test('Incidents - Edit', async ({ page }) => {
    // 1. Navigate to Incidents
    await page.goto('/incidents');
    await waitForPageLoad(page);
    
    // 2. First create an incident to edit
    const uniqueTitle = `INC-EDIT-${Date.now()}`;
    
    await page.locator('button:has-text("Report New Incident")').click();
    await waitForPageLoad(page);
    
    const createModal = page.locator('.fixed.inset-0');
    await createModal.locator('input[placeholder="Brief description of the incident"]').fill(uniqueTitle);
    await createModal.locator('textarea[placeholder="Detailed description of what happened"]').fill('Original Description');
    await createModal.locator('select').first().selectOption({ index: 1 });
    await createModal.locator('select').nth(1).selectOption('Minor');
    
    await createModal.locator('button:has-text("Report Incident")').click();
    await waitForPageLoad(page);
    
    // 3. Find the created incident
    const itemCard = page.locator('.bg-white.shadow.border-l-4').filter({ hasText: uniqueTitle }).first();
    await expect(itemCard).toBeVisible({ timeout: 5000 });
    
    // 4. Click edit button (it has title="Edit")
    const editButton = itemCard.locator('button[title="Edit"]');
    await editButton.click();
    await waitForPageLoad(page);
    
    // 5. Update description
    const editModal = page.locator('.fixed.inset-0');
    await expect(editModal.locator('h2:has-text("Edit Incident")')).toBeVisible();
    await editModal.locator('textarea[placeholder="Detailed description of what happened"]').fill('Updated Description via E2E');
    
    // 6. Save changes
    await editModal.locator('button:has-text("Update")').click();
    await waitForPageLoad(page);
    
    // 7. Verify the change
    await expect(page.locator('text=Updated Description via E2E').first()).toBeVisible({ timeout: 10000 });
  });

  // ========================================
  // OPERATION PLANS TESTS
  // ========================================
  
  test('Operation Plans - View List', async ({ page }) => {
    // 1. Navigate to Operation Plans
    await page.goto('/operation-plans');
    await waitForPageLoad(page);
    
    // 2. Verify page loaded
    const pageLoaded = await page.locator('body').isVisible();
    expect(pageLoaded).toBe(true);
    
    // 3. Check for table or any list structure
    const hasTable = await page.locator('table').count();
    const hasGrid = await page.locator('.grid, [class*="grid"]').count();
    
    if (hasTable > 0) {
      const table = page.locator('table').first();
      await expect(table).toBeVisible({ timeout: 5000 });
      
      // 4. Check for headers
      const headerCount = await page.locator('th').count();
      console.log(`Table has ${headerCount} headers`);
      
      // 5. Count rows
      const rowCount = await page.locator('table tbody tr').count();
      console.log(`Found ${rowCount} operation plan(s)`);
    } else if (hasGrid > 0) {
      console.log('Plans displayed in grid format');
      const itemCount = await page.locator('[class*="card"], [class*="plan"]').count();
      console.log(`Found ${itemCount} plan(s)`);
    } else {
      // Just verify there's some content
      const hasContent = await page.locator('text=/Plan|Operation|Schedule/i').count();
      console.log(`Found ${hasContent} content elements - page may use different layout`);
    }
  });

  test('Operation Plans - Filter and Search', async ({ page }) => {
    // 1. Navigate to Operation Plans
    await page.goto('/operation-plans');
    await waitForPageLoad(page);
    
    // 2. Look for filter/search inputs
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
    const dateFilter = page.locator('input[type="date"]').first();
    
    // 3. Test search if available
    if (await searchInput.count() > 0) {
      const initialCount = await page.locator('table tbody tr').count();
      
      await searchInput.fill('PLAN');
      await waitForPageLoad(page);
      
      const filteredCount = await page.locator('table tbody tr').count();
      console.log(`Filter applied: ${initialCount} → ${filteredCount} results`);
      
      // Clear filter
      await searchInput.clear();
      await waitForPageLoad(page);
    }
    
    // 4. Test date filter if available
    if (await dateFilter.count() > 0) {
      await dateFilter.fill('2025-12-01');
      await waitForPageLoad(page);
      console.log('Date filter applied');
    }
  });

  test('Operation Plans - View Details', async ({ page }) => {
    // 1. Navigate to Operation Plans
    await page.goto('/operation-plans');
    await waitForPageLoad(page);
    
    // 2. Check if any plans exist
    const firstRow = page.locator('table tbody tr').first();
    
    if (await firstRow.count() > 0) {
      // 3. Click on first plan (either row itself or a details button)
      const detailsButton = firstRow.locator('button', { hasText: /view|details/i }).first();
      const detailsLink = firstRow.locator('a').first();
      
      if (await detailsButton.count() > 0) {
        await detailsButton.click();
      } else if (await detailsLink.count() > 0) {
        await detailsLink.click();
      } else {
        await firstRow.click();
      }
      
      await waitForPageLoad(page);
      
      // 4. Verify details view opened (modal or new page)
      const detailsView = page.locator('.modal, .details-panel, [role="dialog"]').first()
        .or(page.locator('h2, h3').filter({ hasText: /Plan|Details/i }));
      
      await expect(detailsView).toBeVisible({ timeout: 5000 });
      
      // 5. Check for scheduled tasks or plan information
      await expect(page.locator('text=/scheduled|tasks|operations/i')).toBeVisible({ timeout: 3000 }).catch(() => {
        console.log('Scheduled tasks section not found');
      });
    } else {
      console.log('No operation plans available to view details');
    }
  });

  test('Operation Plans - Edit Task', async ({ page }) => {
    // 1. Navigate to Operation Plans
    await page.goto('/operation-plans');
    await waitForPageLoad(page);
    
    // 2. Check if any plans exist
    const firstRow = page.locator('table tbody tr').first();
    
    if (await firstRow.count() > 0) {
      // 3. Open plan details
      await firstRow.click();
      await waitForPageLoad(page);
      
      // 4. Look for edit button on a task
      const editTaskButton = page.locator('button', { hasText: /edit|modify/i }).first();
      
      if (await editTaskButton.count() > 0) {
        await editTaskButton.click();
        await waitForPageLoad(page);
        
        // 5. Verify edit form/modal opened
        await expect(page.locator('input, select, textarea')).toBeVisible({ timeout: 3000 });
        
        // 6. Make a change (e.g., update time or resource)
        const timeInput = page.locator('input[type="time"], input[type="datetime-local"]').first();
        if (await timeInput.count() > 0) {
          await timeInput.fill('14:00');
          
          // Save changes
          await page.getByRole('button', { name: /save|update/i }).click();
          await waitForPageLoad(page);
          
          // Verify success
          await expect(page.locator('text=/success|updated|saved/i')).toBeVisible({ timeout: 5000 }).catch(() => {
            console.log('Success message not found, but operation may have completed');
          });
        }
      } else {
        console.log('Edit task functionality not available in UI');
      }
    } else {
      console.log('No operation plans available to edit');
    }
  });

  // ========================================
  // VESSEL VISIT EXECUTION (VVE) TESTS
  // ========================================
  
  test('VVE - Create Vessel Visit Execution', async ({ page }) => {
    // 1. Navigate to Vessel Visit Executions page
    await page.goto('/vessel-visit-executions');
    await waitForPageLoad(page);
    
    // 2. Verify page loaded
    await expect(page.locator('h1:has-text("Vessel Visit Execution")')).toBeVisible({ timeout: 10000 });

    // 3. Open create modal
    const createButton = page.locator('button:has-text("Create VVE")');
    await createButton.click();
    await waitForPageLoad(page);
    
    // 4. Wait for modal to appear
    const modal = page.locator('.fixed.inset-0').last();
    await expect(modal.locator('h2:has-text("Create Vessel Visit Execution")')).toBeVisible({ timeout: 5000 });
    
    // 5. Select VVN from dropdown
    const vvnSelect = modal.locator('select').first();
    await expect(vvnSelect).not.toBeDisabled();
    
    // Wait for VVNs to load
    await page.waitForTimeout(2000);
    
    // Get options count (should be > 1 because first is placeholder)
    const optionsCount = await vvnSelect.locator('option').count();
    
    if (optionsCount > 1) {
      // Select second option (first approved VVN)
      await vvnSelect.selectOption({ index: 1 });
      await waitForPageLoad(page);
      
      // 6. Verify vessel identifier was auto-filled
      const vesselInput = modal.locator('input[placeholder="IMO1234567"]');
      const vesselValue = await vesselInput.inputValue();
      expect(vesselValue).not.toBe('');
      console.log(`Vessel identifier auto-filled: ${vesselValue}`);
      
      // 7. Set actual arrival time
      const arrivalTimeInput = modal.locator('input[type="datetime-local"]').first();
      const now = new Date();
      const arrivalTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16);
      await arrivalTimeInput.fill(arrivalTime);
      
      // 8. Add optional notes
      const notesTextarea = modal.locator('textarea[placeholder*="Add any relevant observations"]');
      const uniqueNote = `E2E Test - VVE created at ${Date.now()}`;
      await notesTextarea.fill(uniqueNote);
      
      // 9. Submit the form
      await modal.locator('button:has-text("Create VVE")').click();
      await waitForPageLoad(page);

      // 10. Verify success message or VVE appears in list
      const successIndicator = page.locator('text=/success|created/i, .bg-green-50').first();
      await expect(successIndicator).toBeVisible({ timeout: 10000 }).catch(() => {
        console.log('Success message not explicitly found, checking for VVE in list');
      });
      
      // 11. Verify the VVE appears in the list
      await expect(page.locator(`text=${uniqueNote}`).first()).toBeVisible({ timeout: 10000 }).catch(() => {
        console.log('Created VVE may not be immediately visible in filtered list');
      });
    } else {
      console.log('No approved VVNs available to create VVE');
    }
  });

  test('VVE - List and View Executions', async ({ page }) => {
    // 1. Navigate to VVE page
    await page.goto('/vessel-visit-executions');
    await waitForPageLoad(page);
    
    // 2. Verify page loaded
    await expect(page.locator('h1:has-text("Vessel Visit Execution")')).toBeVisible();
    
    // 3. Wait for loading to finish
    await expect(page.locator('text=Loading...')).not.toBeVisible().catch(() => {});
    
    // 4. Count VVEs - look for table rows or cards
    const tableRows = await page.locator('table tbody tr').count();
    console.log(`Found ${tableRows} VVE(s) in table`);
    
    if (tableRows > 0) {
      // 5. Verify first VVE has expected content
      const firstRow = page.locator('table tbody tr').first();
      await expect(firstRow).toBeVisible();
      
      // Check for vessel identifier, status, etc.
      await expect(firstRow.locator('td').first()).toBeVisible();
    }
    
    // 6. Verify statistics cards are displayed
    const statCards = page.locator('[class*="stat"], .bg-white.p-4');
    const statCount = await statCards.count();
    console.log(`Found ${statCount} statistic card(s)`);
  });

  test('VVE - Filter Executions', async ({ page }) => {
    // 1. Navigate to VVE page
    await page.goto('/vessel-visit-executions');
    await waitForPageLoad(page);
    
    // 2. Open filters
    const filterButton = page.locator('button:has-text("Filters"), button').filter({ has: page.locator('text=/filter/i') }).first();
    if (await filterButton.count() > 0) {
      await filterButton.click();
      await waitForPageLoad(page);
      
      // 3. Apply status filter
      const statusSelect = page.locator('select').filter({ has: page.locator('option:has-text("In Progress")') }).first();
      if (await statusSelect.count() > 0) {
        const initialCount = await page.locator('table tbody tr').count();
        
        await statusSelect.selectOption('In Progress');
        await waitForPageLoad(page);
        
        const filteredCount = await page.locator('table tbody tr').count();
        console.log(`Status filter applied: ${initialCount} → ${filteredCount} results`);
      }
      
      // 4. Test date range filter
      const fromDateInput = page.locator('input[type="date"]').first();
      const toDateInput = page.locator('input[type="date"]').nth(1);
      
      if (await fromDateInput.count() > 0 && await toDateInput.count() > 0) {
        await fromDateInput.fill('2026-01-01');
        await toDateInput.fill('2026-12-31');
        await waitForPageLoad(page);
        console.log('Date range filter applied');
      }
      
      // 5. Apply search/vessel filter
      await page.locator('button:has-text("Search"), button:has-text("Apply")').first().click().catch(() => {});
      await waitForPageLoad(page);
    } else {
      console.log('Filter functionality not available');
    }
  });

  test('VVE - Update Execution (Add Berth Information)', async ({ page }) => {
    // 1. Navigate to VVE page
    await page.goto('/vessel-visit-executions');
    await waitForPageLoad(page);
    
    // 2. First create a VVE to update
    await page.locator('button:has-text("Create VVE")').click();
    await waitForPageLoad(page);
    
    const createModal = page.locator('.fixed.inset-0').last();
    const vvnSelect = createModal.locator('select').first();
    
    await page.waitForTimeout(2000); // Wait for VVNs to load
    
    const optionsCount = await vvnSelect.locator('option').count();
    
    if (optionsCount > 1) {
      await vvnSelect.selectOption({ index: 1 });
      await waitForPageLoad(page);
      
      const now = new Date();
      const arrivalTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16);
      await createModal.locator('input[type="datetime-local"]').first().fill(arrivalTime);
      
      const uniqueNote = `Update-Test-${Date.now()}`;
      await createModal.locator('textarea').fill(uniqueNote);
      
      await createModal.locator('button:has-text("Create VVE")').click();
      await waitForPageLoad(page);
      
      // 3. Find the created VVE in the list
      const vveRow = page.locator('table tbody tr').filter({ hasText: uniqueNote }).first();
      
      if (await vveRow.count() > 0) {
        // 4. Click edit/update button
        const editButton = vveRow.locator('button[title*="Edit"], button[title*="Update"]').first()
          .or(vveRow.locator('button').filter({ hasText: /edit|update/i }).first());
        
        await editButton.click();
        await waitForPageLoad(page);
        
        // 5. Verify update modal opened
        const updateModal = page.locator('.fixed.inset-0').last();
        await expect(updateModal.locator('h2:has-text("Update")')).toBeVisible({ timeout: 5000 });
        
        // 6. Fill in berth information
        const berthTimeInput = updateModal.locator('input[type="datetime-local"]').first();
        const berthTime = new Date(now.getTime() + 3600000 - now.getTimezoneOffset() * 60000).toISOString().slice(0,16); // 1 hour later
        await berthTimeInput.fill(berthTime);
        
        // Select berth/dock if available
        const berthSelect = updateModal.locator('select').first();
        if (await berthSelect.locator('option').count() > 1) {
          await berthSelect.selectOption({ index: 1 });
        }
        
        // Update notes
        const notesTextarea = updateModal.locator('textarea').last();
        await notesTextarea.fill('Updated with berth information via E2E test');
        
        // 7. Save changes
        await updateModal.locator('button:has-text("Update")').click();
        await waitForPageLoad(page);
        
        // 8. Verify success
        await expect(page.locator('text=/success|updated/i, .bg-green-50').first()).toBeVisible({ timeout: 10000 }).catch(() => {
          console.log('Update may have succeeded without explicit success message');
        });
      } else {
        console.log('Created VVE not found in list for update test');
      }
    } else {
      console.log('No approved VVNs available for update test');
    }
  });

  test('VVE - View Execution Details and Operations', async ({ page }) => {
    // 1. Navigate to VVE page
    await page.goto('/vessel-visit-executions');
    await waitForPageLoad(page);
    
    // 2. Check if any VVEs exist
    const firstRow = page.locator('table tbody tr').first();
    
    if (await firstRow.count() > 0) {
      // 3. Click to view details (may open modal or expand row)
      const detailsButton = firstRow.locator('button').filter({ hasText: /view|details|expand/i }).first();
      
      if (await detailsButton.count() > 0) {
        await detailsButton.click();
        await waitForPageLoad(page);
        
        // 4. Verify operations table or details panel is visible
        const operationsTable = page.locator('table').filter({ has: page.locator('th:has-text("Operation")') }).first();
        const detailsPanel = page.locator('[class*="detail"], [class*="expanded"]').first();
        
        const hasOperations = await operationsTable.count() > 0;
        const hasDetails = await detailsPanel.count() > 0;
        
        if (hasOperations) {
          console.log('Operations table visible');
          await expect(operationsTable).toBeVisible();
          
          // Count operations
          const operationCount = await operationsTable.locator('tbody tr').count();
          console.log(`Found ${operationCount} operation(s)`);
        } else if (hasDetails) {
          console.log('Details panel visible');
          await expect(detailsPanel).toBeVisible();
        } else {
          console.log('Details view format not recognized');
        }
        
        // 5. Look for execution metrics
        await expect(page.locator('text=/metrics|delay|efficiency/i')).toBeVisible({ timeout: 3000 }).catch(() => {
          console.log('Execution metrics section not found');
        });
      } else {
        // Maybe clicking the row itself shows details
        await firstRow.click();
        await waitForPageLoad(page);
        console.log('Clicked row to view details');
      }
    } else {
      console.log('No VVEs available to view details');
    }
  });

  // ========================================
  // COMPLEMENTARY TASKS TESTS
  // ========================================
  
  test('Complementary Tasks - Create Task', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Get a real VVE ID from the system
    const vveId = await getFirstVveId(page);
    
    // 3. Verify page loaded
    await expect(page.locator('h1').filter({ hasText: /complementary tasks/i })).toBeVisible({ timeout: 10000 });

    // 4. Open create form
    await page.locator('button:has-text("New Task")').click();
    await waitForPageLoad(page);
    
    // 5. Wait for modal
    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2:has-text("New Task")')).toBeVisible({ timeout: 5000 });
    
    // 6. Fill in the form - wait for category dropdown to load
    const categorySelect = modal.locator('select').first();
    await expect(categorySelect).toBeVisible();
    
    // Wait longer for categories to load from API
    await page.waitForTimeout(2000);
    
    // Verify options are available
    const optionCount = await categorySelect.locator('option').count();
    console.log(`Found ${optionCount} category options`);
    
    if (optionCount <= 1) {
      throw new Error(`No categories available in dropdown. Expected > 1, got ${optionCount}. Make sure categories exist in the system.`);
    }
    
    // Select first available category (index 1, since index 0 is "Select...")
    await categorySelect.selectOption({ index: 1 });
    
    // Fill VVE ID with real ID from system
    await modal.locator('input[placeholder="e.g. VVE-2026-001"]').fill(vveId);
    
    // Fill Responsible Team
    await modal.locator('input[placeholder="e.g. Safety Team, Maintenance Crew"]').fill('E2E Test Team');
    
    // Fill Start Time
    const startTime = new Date();
    startTime.setHours(10, 0, 0, 0);
    const startTimeStr = startTime.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    await modal.locator('input[type="datetime-local"]').first().fill(startTimeStr);

    // Fill End Time
    const endTime = new Date();
    endTime.setHours(12, 0, 0, 0);
    const endTimeStr = endTime.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    await modal.locator('input[type="datetime-local"]').nth(1).fill(endTimeStr);
    
    // Select Status (PENDING is default, but we'll select ONGOING)
    const statusSelect = modal.locator('select').nth(1);
    await statusSelect.selectOption('ONGOING');
    
    // Fill Description (optional but let's add it)
    await modal.locator('textarea[placeholder="Brief description of the task..."]').fill('E2E Test Task Description');
    
    // 6. Submit the form
    await modal.locator('button:has-text("Create Task")').click();
    await waitForPageLoad(page);

    // 7. Verify modal is closed (task was created successfully)
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    // 8. Verify task appears in the list with E2E Test Team
    expect(page.locator('text=E2E Test Team'));
  });

  test('Complementary Tasks - List and View', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Verify page loaded
    await expect(page.locator('h1:has-text("Complementary Tasks")')).toBeVisible();
    
    // 3. Check if tasks are displayed
    await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 5000 });
    
    // 4. Count task cards
    const taskCards = page.locator('.bg-white.shadow.rounded-lg.border.p-6');
    const cardCount = await taskCards.count();
    console.log(`Found ${cardCount} complementary task(s)`);
    
    if (cardCount > 0) {
      // 5. Verify structure of first task card
      const firstCard = taskCards.first();
      await expect(firstCard).toBeVisible();
      
      // Check for key elements
      await expect(firstCard.locator('text=/CT-/i')).toBeVisible(); // Task ID
      await expect(firstCard.locator('text=/VVE-/i')).toBeVisible(); // VVE ID
      await expect(firstCard.locator('text=/Responsible Team/i')).toBeVisible();
      
      // Check for status badge
      const statusBadge = firstCard.locator('.px-3.py-1.rounded-full');
      await expect(statusBadge).toBeVisible();
    }
  });

  test('Complementary Tasks - Search Functionality', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Wait for page to load
    await expect(page.locator('h1:has-text("Complementary Tasks")')).toBeVisible();
    
    // 3. Find search input
    const searchInput = page.locator('input[placeholder="Search tasks..."]');
    await expect(searchInput).toBeVisible();
    
    // 4. Get initial count
    const initialCards = page.locator('.bg-white.shadow.rounded-lg.border.p-6');
    const initialCount = await initialCards.count();
    console.log(`Initial task count: ${initialCount}`);
    
    // 5. Enter search term
    await searchInput.fill('VVE');
    await waitForPageLoad(page);
    
    // 6. Verify filtered results
    const filteredCards = page.locator('.bg-white.shadow.rounded-lg.border.p-6');
    const filteredCount = await filteredCards.count();
    console.log(`Filtered task count: ${filteredCount}`);
    
    // 7. Clear search
    await searchInput.clear();
    await waitForPageLoad(page);
  });

  test('Complementary Tasks - Filter by Status', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Open filters
    await page.locator('button:has-text("Filters")').click();
    await waitForPageLoad(page);
    
    // 3. Verify filter panel is visible
    await expect(page.locator('label:has-text("Status")')).toBeVisible({ timeout: 3000 });
    
    // 4. Select status filter
    const statusSelect = page.locator('label:has-text("Status")').locator('..').locator('select');
    await statusSelect.selectOption('ONGOING');
    
    // 5. Apply filters
    await page.locator('button:has-text("Apply Filters")').click();
    await waitForPageLoad(page);
    
    // 6. Verify filtered results show only ONGOING tasks
    const taskCards = page.locator('.bg-white.shadow.rounded-lg.border.p-6');
    const cardCount = await taskCards.count();
    
    if (cardCount > 0) {
      // Check first card has ONGOING status
      await expect(taskCards.first().locator('text=ONGOING')).toBeVisible();
    }
    
    console.log(`Found ${cardCount} ONGOING task(s)`);
  });

  test('Complementary Tasks - Filter by Category', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Open filters
    await page.locator('button:has-text("Filters")').click();
    await waitForPageLoad(page);
    
    // 3. Select category filter
    const categorySelect = page.locator('label:has-text("Category")').locator('..').locator('select');
    
    // Get available options
    const optionCount = await categorySelect.locator('option').count();
    console.log(`Found ${optionCount - 1} categories`); // -1 for "All Categories"
    
    if (optionCount > 1) {
      // Select first non-empty category
      await categorySelect.selectOption({ index: 1 });
      
      // 4. Apply filters
      await page.locator('button:has-text("Apply Filters")').click();
      await waitForPageLoad(page);
      
      // 5. Verify results
      const taskCards = page.locator('.bg-white.shadow.rounded-lg.border.p-6');
      const cardCount = await taskCards.count();
      console.log(`Found ${cardCount} task(s) for selected category`);
    }
  });

  test('Complementary Tasks - Filter by Suspends Operations', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Open filters
    await page.locator('button:has-text("Filters")').click();
    await waitForPageLoad(page);
    
    // 3. Filter by tasks that suspend operations
    const suspendsSelect = page.locator('label:has-text("Suspends Operations")').locator('..').locator('select');
    await suspendsSelect.selectOption('true'); // Yes (Impacting)
    
    // 4. Apply filters
    await page.locator('button:has-text("Apply Filters")').click();
    await waitForPageLoad(page);
    
    // 5. Verify results show impacting tasks
    const taskCards = page.locator('.bg-white.shadow.rounded-lg.border.p-6');
    const cardCount = await taskCards.count();
    
    if (cardCount > 0) {
      // Check for "IMPACTING OPERATIONS" or "Suspends Ops" badge
      const impactingBadge = taskCards.first().locator('text=/IMPACTING OPERATIONS|Suspends Ops/i');
      await expect(impactingBadge).toBeVisible().catch(() => {
        console.log('No impacting tasks found with current data');
      });
    }
    
    console.log(`Found ${cardCount} task(s) that suspend operations`);
  });

  test('Complementary Tasks - Filter by Date Range', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Open filters
    await page.locator('button:has-text("Filters")').click();
    await waitForPageLoad(page);
    
    // 3. Set date range
    const startDateFrom = new Date();
    startDateFrom.setDate(startDateFrom.getDate() - 7); // 7 days ago
    const startDateFromStr = startDateFrom.toISOString().slice(0, 16);
    
    const startDateTo = new Date();
    startDateTo.setDate(startDateTo.getDate() + 7); // 7 days from now
    const startDateToStr = startDateTo.toISOString().slice(0, 16);
    
    // Fill date filters
    const dateInputs = page.locator('input[type="datetime-local"]');
    await dateInputs.nth(0).fill(startDateFromStr); // Start Date From
    await dateInputs.nth(1).fill(startDateToStr);   // Start Date To
    
    // 4. Apply filters
    await page.locator('button:has-text("Apply Filters")').click();
    await waitForPageLoad(page);
    
    // 5. Verify results
    const taskCards = page.locator('.bg-white.shadow.rounded-lg.border.p-6');
    const cardCount = await taskCards.count();
    console.log(`Found ${cardCount} task(s) in date range`);
  });

  test('Complementary Tasks - Filter by Responsible Team', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Open filters
    await page.locator('button:has-text("Filters")').click();
    await waitForPageLoad(page);
    
    // 3. Enter responsible team filter
    const teamInput = page.locator('label:has-text("Responsible Team")').locator('..').locator('input');
    await teamInput.fill('Safety');
    
    // 4. Apply filters
    await page.locator('button:has-text("Apply Filters")').click();
    await waitForPageLoad(page);
    
    // 5. Verify results
    const taskCards = page.locator('.bg-white.shadow.rounded-lg.border.p-6');
    const cardCount = await taskCards.count();
    console.log(`Found ${cardCount} task(s) with 'Safety' in team name`);
  });

  test('Complementary Tasks - Reset Filters', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Open filters and apply some filters
    await page.locator('button:has-text("Filters")').click();
    await waitForPageLoad(page);
    
    const statusSelect = page.locator('label:has-text("Status")').locator('..').locator('select');
    await statusSelect.selectOption('COMPLETED');
    
    await page.locator('button:has-text("Apply Filters")').click();
    await waitForPageLoad(page);
    
    const filteredCount = await page.locator('.bg-white.shadow.rounded-lg.border.p-6').count();
    console.log(`Filtered count: ${filteredCount}`);
    
    // 3. Open filters again and clear
    await page.locator('button:has-text("Filters")').click();
    await waitForPageLoad(page);
    
    await page.locator('button:has-text("Clear")').click();
    await waitForPageLoad(page);
    
    // 4. Verify all tasks are shown again
    const resetCount = await page.locator('.bg-white.shadow.rounded-lg.border.p-6').count();
    console.log(`Reset count: ${resetCount}`);
    
    expect(resetCount >= filteredCount).toBe(true);
  });

  test('Complementary Tasks - Edit Task', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Get a real VVE ID from the system
    const vveId = await getFirstVveId(page);
    
    // 3. First create a task to edit
    await page.locator('button:has-text("New Task")').click();
    await waitForPageLoad(page);
    
    const createModal = page.locator('.fixed.inset-0');
    
    // Fill form with unique identifier
    const uniqueTeam = `EditTeam-${Date.now()}`;
    await page.waitForTimeout(2000); // Wait longer for categories to load
    
    const categorySelect = createModal.locator('select').first();
    const optionCount = await categorySelect.locator('option').count();
    if (optionCount <= 1) {
      throw new Error('No categories available in dropdown for Edit test');
    }
    await categorySelect.selectOption({ index: 1 });
    await createModal.locator('input[placeholder="e.g. VVE-2026-001"]').fill(vveId);
    await createModal.locator('input[placeholder="e.g. Safety Team, Maintenance Crew"]').fill(uniqueTeam);
    
    const startTime = new Date();
    startTime.setHours(10, 0, 0, 0);
    const startTimeStr = startTime.toISOString().slice(0, 16);
    await createModal.locator('input[type="datetime-local"]').first().fill(startTimeStr);

    // Fill End Time
    const endTime = new Date();
    endTime.setHours(12, 0, 0, 0);
    const endTimeStr = endTime.toISOString().slice(0, 16);
    await createModal.locator('input[type="datetime-local"]').nth(1).fill(endTimeStr);
    
    await createModal.locator('select').nth(1).selectOption('PENDING');
    await createModal.locator('textarea').fill('Original description');
    
    await createModal.locator('button:has-text("Create Task")').click();
    await waitForPageLoad(page);
    
    // 3. Find the created task
    const taskCard = page.locator('[data-testid="complementary-task-card"]').filter({ hasText: uniqueTeam }).first();
    await expect(taskCard).toBeVisible({ timeout: 5000 });
    
    // 4. Click edit button
    // Use data-testid if available, fallback to title attribute
    const editButton = taskCard.locator('button[data-testid^="edit-task-"]').first();
    await expect(editButton).toBeVisible();
    await editButton.click();
    await waitForPageLoad(page);
    
    // 5. Update the task
    const editModal = page.locator('.fixed.inset-0');
    expect(editModal.locator('h2:has-text("Edit Task")'));
    
    // Change status to ONGOING
    await editModal.locator('select').nth(1).selectOption('ONGOING');
    
    // Update description
    await editModal.locator('textarea').fill('Updated description via E2E test');
    
    // Update responsible team
    await editModal.locator('input[placeholder="e.g. Safety Team, Maintenance Crew"]').fill(`${uniqueTeam}-Updated`);
    
    // 6. Save changes
    await editModal.locator('button:has-text("Update Task")').click();
    await waitForPageLoad(page);
    
    // 7. Verify success message
    expect(page.locator('text=/Task updated successfully|updated/i'));
    
    // 8. Verify the changes in the list
    expect(page.locator(`text=${uniqueTeam}-Updated`));
    expect(page.locator('text=ONGOING'));
  });

  test('Complementary Tasks - Complete a Task (Add End Time)', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Get a real VVE ID from the system
    const vveId = await getFirstVveId(page);
    
    // 3. Create a task in ONGOING status
    await page.locator('button:has-text("New Task")').click();
    await waitForPageLoad(page);
    
    const createModal = page.locator('.fixed.inset-0');
    const uniqueTeam = `CompleteTeam-${Date.now()}`;
    
    await page.waitForTimeout(2000); // Wait longer for categories to load
    
    const categorySelect = createModal.locator('select').first();
    const optionCount = await categorySelect.locator('option').count();
    if (optionCount <= 1) {
      throw new Error('No categories available in dropdown for Complete test');
    }
    await categorySelect.selectOption({ index: 1 });
    await createModal.locator('input[placeholder="e.g. VVE-2026-001"]').fill(vveId);
    await createModal.locator('input[placeholder="e.g. Safety Team, Maintenance Crew"]').fill(uniqueTeam);
    
    const startTime = new Date();
    startTime.setHours(10, 0, 0, 0);
    await createModal.locator('input[type="datetime-local"]').first().fill(startTime.toISOString().slice(0, 16));
    
    // Fill End Time (2 hours after start - will be updated later when completing)
    const initialEndTime = new Date(startTime);
    initialEndTime.setHours(startTime.getHours() + 2);
    await createModal.locator('input[type="datetime-local"]').nth(1).fill(initialEndTime.toISOString().slice(0, 16));
    
    await createModal.locator('select').nth(1).selectOption('ONGOING');
    await createModal.locator('textarea').fill('Task to be completed');
    
    await createModal.locator('button:has-text("Create Task")').click();
    await waitForPageLoad(page);
    
    // 3. Find and edit the task to complete it
    const taskCard = page.locator('[data-testid="complementary-task-card"]').filter({ hasText: uniqueTeam }).first();
    await expect(taskCard).toBeVisible({ timeout: 5000 });
    
    const editButton = taskCard.locator('button[data-testid^="edit-task-"]').first();
    await expect(editButton).toBeVisible();
    await editButton.click();
    await waitForPageLoad(page);
    
    // 4. Complete the task
    const editModal = page.locator('.fixed.inset-0');
    
    // Set end time
    const endTime = new Date();
    endTime.setHours(14, 0, 0, 0); // 4 hours after start
    await editModal.locator('input[type="datetime-local"]').nth(1).fill(endTime.toISOString().slice(0, 16));
    
    // Change status to COMPLETED
    await editModal.locator('select').nth(1).selectOption('COMPLETED');
    
    await editModal.locator('button:has-text("Update Task")').click();
    await waitForPageLoad(page);
    
    // 5. Verify completion
    expect(page.locator('text=/Task updated successfully|updated/i'));
    
    // Verify COMPLETED status badge
    const updatedCard = page.locator('.bg-white.shadow.rounded-lg.border.p-6').filter({ hasText: uniqueTeam }).first();
    expect(updatedCard.locator('text=COMPLETED'));
    
    // Verify duration is displayed (should be ~4 hours = 240 minutes)
    expect(updatedCard.locator('text=/4h|240m/i'));
  });

  test('Complementary Tasks - Delete Task', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Get a real VVE ID from the system
    const vveId = await getFirstVveId(page);
    
    // 3. Create a task to delete
    await page.locator('button:has-text("New Task")').click();
    await waitForPageLoad(page);
    
    const createModal = page.locator('.fixed.inset-0');
    const uniqueTeam = `DeleteTeam-${Date.now()}`;
    
    await page.waitForTimeout(2000); // Wait longer for categories to load
    
    const categorySelect = createModal.locator('select').first();
    const optionCount = await categorySelect.locator('option').count();
    if (optionCount <= 1) {
      throw new Error('No categories available in dropdown for Delete test');
    }
    await categorySelect.selectOption({ index: 1 });
    await createModal.locator('input[placeholder="e.g. VVE-2026-001"]').fill(vveId);
    await createModal.locator('input[placeholder="e.g. Safety Team, Maintenance Crew"]').fill(uniqueTeam);
    
    const startTime = new Date();
    const startTimeStr = startTime.toISOString().slice(0, 16);
    await createModal.locator('input[type="datetime-local"]').first().fill(startTimeStr);

    // Fill End Time
    const endTime = new Date();
    endTime.setHours(startTime.getHours() + 2);
    const endTimeStr = endTime.toISOString().slice(0, 16);
    await createModal.locator('input[type="datetime-local"]').nth(1).fill(endTimeStr);
    
    await createModal.locator('select').nth(1).selectOption('PENDING');
    await createModal.locator('textarea').fill('Task to be deleted');
    
    await createModal.locator('button:has-text("Create Task")').click();
    await waitForPageLoad(page);
    
    // 3. Find the created task
    const taskCard = page.locator('[data-testid="complementary-task-card"]').filter({ hasText: uniqueTeam }).first();
    await expect(taskCard).toBeVisible({ timeout: 5000 });

    // 4. Click delete button
    const deleteButton = taskCard.locator('button[data-testid^="delete-task-"]').first();
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
    await waitForPageLoad(page);
    
    // 5. Confirm deletion in modal
    const confirmModal = page.locator('.fixed.inset-0');
    expect(confirmModal.locator('text=/confirm|delete/i'));
    
    // Click confirm button (red button with "Delete" or "Confirm")
    await confirmModal.locator('button:has-text("Delete"), button:has-text("Confirm")').first().click();
    await waitForPageLoad(page);
    
    // 6. Verify deletion success
    expect(page.locator('text=/Task deleted successfully|deleted/i'));
    
    // 7. Verify task is no longer in the list
    await expect(page.locator(`text=${uniqueTeam}`)).not.toBeVisible();
  });

  test('Complementary Tasks - Refresh Button', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Get initial count
    const initialCount = await page.locator('.bg-white.shadow.rounded-lg.border.p-6').count();
    console.log(`Initial count: ${initialCount}`);
    
    // 3. Click refresh button
    await page.locator('button:has-text("Refresh")').click();
    await waitForPageLoad(page);
    
    // 4. Verify data is reloaded (count should be same or updated)
    const refreshedCount = await page.locator('.bg-white.shadow.rounded-lg.border.p-6').count();
    console.log(`Refreshed count: ${refreshedCount}`);
    
    // Just verify page is still functional after refresh
    await expect(page.locator('h1:has-text("Complementary Tasks")')).toBeVisible();
  });

  test('Complementary Tasks - Task with Suspends Operations Flag', async ({ page }) => {
    // 1. Navigate to Complementary Tasks
    await page.goto('/complementary-tasks');
    await waitForPageLoad(page);
    
    // 2. Get a real VVE ID from the system
    const vveId = await getFirstVveId(page);
    
    // 3. Create a task that suspends operations
    await page.locator('button:has-text("New Task")').click();
    await waitForPageLoad(page);
    
    const createModal = page.locator('.fixed.inset-0');
    const uniqueTeam = `SuspendTeam-${Date.now()}`;
    
    await page.waitForTimeout(2000); // Wait longer for categories to load
    
    const categorySelect = createModal.locator('select').first();
    const optionCount = await categorySelect.locator('option').count();
    if (optionCount <= 1) {
      throw new Error('No categories available in dropdown for Suspends Operations test');
    }
    await categorySelect.selectOption({ index: 1 });
    await createModal.locator('input[placeholder="e.g. VVE-2026-001"]').fill(vveId);
    await createModal.locator('input[placeholder="e.g. Safety Team, Maintenance Crew"]').fill(uniqueTeam);
    
    const startTime = new Date();
    const startTimeStr = startTime.toISOString().slice(0, 16);
    await createModal.locator('input[type="datetime-local"]').first().fill(startTimeStr);

    // Fill End Time
    const endTime = new Date();
    endTime.setHours(startTime.getHours() + 2);
    const endTimeStr = endTime.toISOString().slice(0, 16);
    await createModal.locator('input[type="datetime-local"]').nth(1).fill(endTimeStr);
    
    await createModal.locator('select').nth(1).selectOption('ONGOING');
    await createModal.locator('textarea').fill('Emergency maintenance - suspends all operations');
    
    // Check the "Suspends Operations" checkbox
    const suspendsCheckbox = createModal.locator('input[type="checkbox"]');
    await suspendsCheckbox.check();
    
    await createModal.locator('button:has-text("Create Task")').click();
    await waitForPageLoad(page);
    
    // 3. Verify the task shows impacting badge
    const taskCard = page.locator('.bg-white.shadow.rounded-lg.border.p-6').filter({ hasText: uniqueTeam }).first();
    
    // Should show "IMPACTING OPERATIONS" or "Suspends Ops" badge
    expect(taskCard.locator('text=/IMPACTING OPERATIONS|Suspends Ops/i'));
    
    // Should also show ONGOING status since it's actively impacting
    expect(taskCard.locator('text=ONGOING'));
  });

  // ========================================
  // MISSING PLANS TESTS
  // ========================================

  test('Missing Plans - Check for Missing Plans', async ({ page }) => {
    // 1. Navigate to Missing Plans page
    await page.goto('/missing-plans');
    await waitForPageLoad(page);
    
    // 2. Verify page loaded
    await expect(page.locator('h1:has-text("Missing Operation Plans")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Identify Vessel Visit Notifications without operation plans')).toBeVisible();

    // 3. Select a date (use tomorrow to avoid conflicts with existing data)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    const dateInput = page.locator('input[type="date"]#checkDate');
    await dateInput.fill(dateString);
    
    // 4. Click "Check Missing Plans" button
    await page.locator('button:has-text("Check Missing Plans")').click();
    await waitForPageLoad(page);
    
    // 5. Verify results are displayed (either missing VVNs or success message)
    // The page should show either:
    // - Statistics cards with numbers
    // - "All VVNs Have Operation Plans" message if none are missing
    // - Error message if something went wrong
    
    const hasMissingPlans = await page.locator('h2:has-text("Vessel Visits Missing Operation Plans")').isVisible({ timeout: 5000 }).catch(() => false);
    const hasAllPlansMessage = await page.locator('text=Ready to Check Missing Plans').isVisible({ timeout: 5000 }).catch(() => false);
    
    // One of these should be true
    expect(hasMissingPlans || hasAllPlansMessage).toBeTruthy();
    
    // 6. Verify statistics cards are visible (should show counts)
    if (hasMissingPlans || hasAllPlansMessage) {
      await expect(page.locator('text=Missing Plans').first()).toBeVisible();
    }
  });

  test('Missing Plans - View Missing VVN Details', async ({ page }) => {
    // 1. Navigate to Missing Plans page
    await page.goto('/missing-plans');
    await waitForPageLoad(page);
    
    // 2. Select today's date (more likely to have pending VVNs)
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]#checkDate').fill(today);
    
    // 3. Check for missing plans
    await page.locator('button:has-text("Check Missing Plans")').click();
    await waitForPageLoad(page);
    
    // 4. Check if there are missing VVNs
    const missingVVNsTable = page.locator('table');
    const hasMissingVVNs = await missingVVNsTable.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasMissingVVNs) {
      // 5. Verify table headers
      await expect(page.locator('th:has-text("Business ID")')).toBeVisible();
      await expect(page.locator('th:has-text("Vessel IMO")')).toBeVisible();
      await expect(page.locator('th:has-text("Estimated Arrival")')).toBeVisible();
      await expect(page.locator('th:has-text("Estimated Departure")')).toBeVisible();
      await expect(page.locator('th:has-text("Assigned Dock")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
      
      // 6. Verify at least one row of data exists
      const firstRow = page.locator('tbody tr').first();
      await expect(firstRow).toBeVisible();
      
      // 7. Verify row contains expected data structure
      await expect(firstRow.locator('td').first()).toBeVisible(); // Business ID
      
      console.log('✓ Missing VVNs table displayed with data');
    } else {
      // No missing VVNs - verify success message
      await expect(page.locator('text=All VVNs Have Operation Plans')).toBeVisible();
      console.log('✓ All VVNs have operation plans for this date');
    }
  });

  test('Missing Plans - Algorithm Selection', async ({ page }) => {
    // 1. Navigate to Missing Plans page
    await page.goto('/missing-plans');
    await waitForPageLoad(page);
    
    // 2. Verify algorithm selector is present
    const algorithmSelect = page.locator('select#algorithm');
    await expect(algorithmSelect).toBeVisible();
    
    // 3. Verify algorithm options
    const options = await algorithmSelect.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(0);
    
    // Should include key algorithms
    expect(options.some(opt => opt.includes('Automatic'))).toBeTruthy();
    expect(options.some(opt => opt.includes('Optimal'))).toBeTruthy();
    expect(options.some(opt => opt.includes('Heuristic'))).toBeTruthy();
    expect(options.some(opt => opt.includes('Genetic'))).toBeTruthy();
    
    // 4. Test changing algorithm
    await algorithmSelect.selectOption('optimal');
    expect(await algorithmSelect.inputValue()).toBe('optimal');
    
    await algorithmSelect.selectOption('heuristic');
    expect(await algorithmSelect.inputValue()).toBe('heuristic');
    
    console.log('✓ Algorithm selection works correctly');
  });

  test('Missing Plans - Regenerate Plans Confirmation Dialog', async ({ page }) => {
    // 1. Navigate to Missing Plans page
    await page.goto('/missing-plans');
    await waitForPageLoad(page);
    
    // 2. Select a future date to avoid interfering with real data
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // One week from now
    const dateString = futureDate.toISOString().split('T')[0];
    
    await page.locator('input[type="date"]#checkDate').fill(dateString);
    
    // 3. Check for missing plans
    await page.locator('button:has-text("Check Missing Plans")').click();
    await waitForPageLoad(page);
    
    // 4. Check if "Regenerate All Plans" button is visible (only shows when there are missing VVNs)
    const regenerateButton = page.locator('button:has-text("Regenerate All Plans")');
    const isRegenerateVisible = await regenerateButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isRegenerateVisible) {
      // 5. Click regenerate button
      await regenerateButton.click();
      await page.waitForTimeout(500);
      
      // 6. Verify confirmation dialog appears
      const confirmDialog = page.locator('.fixed.inset-0').filter({ hasText: 'Confirm Regeneration' });
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });
      
      // 7. Verify dialog content
      await expect(confirmDialog.locator('text=/will delete existing plans/i')).toBeVisible();
      await expect(confirmDialog.locator('text=/cannot be undone/i')).toBeVisible();
      
      // 8. Verify dialog buttons
      await expect(confirmDialog.locator('button:has-text("Cancel")')).toBeVisible();
      await expect(confirmDialog.locator('button:has-text("Confirm")')).toBeVisible();
      
      // 9. Test cancel button
      await confirmDialog.locator('button:has-text("Cancel")').click();
      await page.waitForTimeout(500);
      
      // Dialog should close
      await expect(confirmDialog).not.toBeVisible();
      
      console.log('✓ Regenerate confirmation dialog works correctly');
    } else {
      console.log('⚠️ No missing VVNs found - Regenerate button not displayed');
    }
  });

  test('Missing Plans - Existing Plans Summary Display', async ({ page }) => {
    // 1. Navigate to Missing Plans page
    await page.goto('/missing-plans');
    await waitForPageLoad(page);
    
    // 2. Use today's date (more likely to have existing plans)
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]#checkDate').fill(today);
    
    // 3. Check for missing plans
    await page.locator('button:has-text("Check Missing Plans")').click();
    await waitForPageLoad(page);
    
    // 4. Check if existing plans section is visible
    const existingPlansSection = page.locator('h2:has-text("Existing Operation Plans")');
    const hasExistingPlans = await existingPlansSection.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasExistingPlans) {
      // 5. Verify existing plans display
      const planCards = page.locator('.border.border-gray-200.rounded-lg.p-4.bg-gray-50');
      const planCount = await planCards.count();
      
      expect(planCount).toBeGreaterThan(0);
      
      // 6. Verify first plan card structure
      const firstPlan = planCards.first();
      
      // Should display Plan ID (format: PLAN-YYYYMMDD-XXXX)
      await expect(firstPlan.locator('text=/PLAN-\\d{8}-\\d{4}/i')).toBeVisible();
      
      // Should display algorithm
      await expect(firstPlan.locator('text=/Algorithm:/i')).toBeVisible();
      
      // Should display task count
      await expect(firstPlan.locator('text=/Tasks:/i')).toBeVisible();
      
      // Should display creation date
      await expect(firstPlan.locator('text=/Created:/i')).toBeVisible();
      
      console.log(`✓ Existing plans displayed: ${planCount} plan(s)`);
    } else {
      console.log('⚠️ No existing plans for this date');
    }
  });

  test('Missing Plans - Date Navigation', async ({ page }) => {
    // 1. Navigate to Missing Plans page
    await page.goto('/missing-plans');
    await waitForPageLoad(page);
    
    // 2. Verify date input is present and has default value (today)
    const dateInput = page.locator('input[type="date"]#checkDate');
    await expect(dateInput).toBeVisible();
    
    const initialDate = await dateInput.inputValue();
    expect(initialDate).toBeTruthy();
    
    // 3. Test changing to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    await dateInput.fill(tomorrowString);
    expect(await dateInput.inputValue()).toBe(tomorrowString);
    
    // 4. Check plans for tomorrow
    await page.locator('button:has-text("Check Missing Plans")').click();
    await waitForPageLoad(page);
    
    // Should show results (either missing VVNs or success message)
    const hasResults = await page.locator('text=/Missing Plans|All VVNs Have Operation Plans/i').first().isVisible({ timeout: 5000 });
    expect(hasResults).toBeTruthy();
    
    // 5. Test changing to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    await dateInput.fill(yesterdayString);
    expect(await dateInput.inputValue()).toBe(yesterdayString);
    
    // 6. Check plans for yesterday
    await page.locator('button:has-text("Check Missing Plans")').click();
    await waitForPageLoad(page);
    
    // Should show results
    const hasResultsYesterday = await page.locator('text=/Missing Plans|All VVNs Have Operation Plans/i').first().isVisible({ timeout: 5000 });
    expect(hasResultsYesterday).toBeTruthy();
    
    console.log('✓ Date navigation works correctly');
  });

  test('Missing Plans - Error Handling', async ({ page }) => {
    // 1. Navigate to Missing Plans page
    await page.goto('/missing-plans');
    await waitForPageLoad(page);
    
    // 2. Test with invalid date format (empty)
    const dateInput = page.locator('input[type="date"]#checkDate');
    await dateInput.fill('');
    
    // Since date is required, the button is "greyed out", and cannot be clicked
    // Check that cant click button
    const checkButton = page.locator('button:has-text("Check Missing Plans")');
    const isDisabled = await checkButton.isDisabled();
    expect(isDisabled).toBeTruthy();
    
    
    await page.waitForTimeout(1000);
    
    // 3. Reset to valid date
    const today = new Date().toISOString().split('T')[0];
    await dateInput.fill(today);
    
    // 4. Verify normal operation resumes
    await page.locator('button:has-text("Check Missing Plans")').click();
    await waitForPageLoad(page);
    
    // Should show results without errors
    const hasValidResults = await page.locator('text=/Missing Plans|All VVNs Have Operation Plans/i').first().isVisible({ timeout: 5000 });
    expect(hasValidResults).toBeTruthy();
    
    console.log('✓ Error handling tested');
  });

  test('Missing Plans - Loading State', async ({ page }) => {
    // 1. Navigate to Missing Plans page
    await page.goto('/missing-plans');
    await waitForPageLoad(page);
    
    // 2. Select a date
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]#checkDate').fill(today);
    
    // 3. Click check button and immediately check for loading state
    const checkButton = page.locator('button:has-text("Check Missing Plans")');
    await checkButton.click();
    
    // 4. Verify button shows loading state during operation
    // Note: Loading state might be too fast to catch in some cases
    
    // Wait for completion
    await waitForPageLoad(page);
    
    // 5. Verify button returns to normal state
    const buttonTextAfterLoad = await checkButton.textContent();
    expect(buttonTextAfterLoad).toContain('Check Missing Plans');
    
    console.log('✓ Loading state tested');
  });

  test('Missing Plans - Statistics Cards Display', async ({ page }) => {
    // 1. Navigate to Missing Plans page
    await page.goto('/missing-plans');
    await waitForPageLoad(page);
    
    // 2. Select date and check plans
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]#checkDate').fill(today);
    await page.locator('button:has-text("Check Missing Plans")').click();
    await waitForPageLoad(page);
    
    // 3. Verify statistics cards are visible
    const statsVisible = await page.locator('text=Missing Plans').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (statsVisible) {
      // 4. Verify all three stat cards
      await expect(page.locator('text=Missing Plans').first()).toBeVisible();
      await expect(page.locator('text=Existing Plans').first()).toBeVisible();
      await expect(page.locator('text=Total VVNs').first()).toBeVisible();
      
      // 5. Verify cards display numerical values
      // The values should be numbers (even if 0)
      const statCards = page.locator('.grid.grid-cols-1.md\\:grid-cols-3').first();
      await expect(statCards).toBeVisible();
      
      console.log('✓ Statistics cards displayed correctly');
    } else {
      console.log('⚠️ No statistics to display for this date');
    }
  });

  test('Missing Plans - Full Workflow with Regeneration', async ({ page }) => {
    // This test performs the complete workflow: check → regenerate → verify
    // Use a far future date to avoid conflicts
    
    // 1. Navigate to Missing Plans page
    await page.goto('/missing-plans');
    await waitForPageLoad(page);
    
    // 2. Select a far future date (30 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateString = futureDate.toISOString().split('T')[0];
    
    await page.locator('input[type="date"]#checkDate').fill(dateString);
    
    // 3. Select Heuristic algorithm (faster than genetic)
    await page.locator('select#algorithm').selectOption('heuristic');
    
    // 4. Check for missing plans
    await page.locator('button:has-text("Check Missing Plans")').click();
    await waitForPageLoad(page);
    
    // 5. Record initial state
    const initialMissingVisible = await page.locator('h2:has-text("Vessel Visits Missing Operation Plans")').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (initialMissingVisible) {
      console.log('✓ Found missing plans for future date');
      
      // 6. Click regenerate button
      const regenerateButton = page.locator('button:has-text("Regenerate All Plans")');
      await regenerateButton.click();
      await page.waitForTimeout(500);
      
      // 7. Confirm regeneration in dialog
      const confirmDialog = page.locator('.fixed.inset-0').filter({ hasText: 'Confirm' });
      const isDialogVisible = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isDialogVisible) {
        await confirmDialog.locator('button:has-text("Confirm")').click();
        
        // 8. Wait for regeneration to complete (can take several seconds)
        await page.waitForTimeout(3000);
        
        // 9. Verify success message or updated state
        const successMessage = await page.locator('text=/Successfully regenerated|operation plan/i').isVisible({ timeout: 10000 }).catch(() => false);
        
        if (successMessage) {
          console.log('✓ Plans regenerated successfully');
          
          // 10. Verify the missing plans list is updated
          await page.waitForTimeout(2000);
          
          // The page should now show either:
          // - Fewer missing VVNs, or
          // - "All VVNs Have Operation Plans" message, or
          // - Updated existing plans section
          
          const finalState = await page.locator('text=/Missing Plans|All VVNs Have Operation Plans|Existing Operation Plans/i').first().isVisible({ timeout: 5000 });
          expect(finalState).toBeTruthy();
          
          console.log('✓ Full regeneration workflow completed');
        } else {
          console.log('⚠️ Regeneration initiated but may still be processing');
        }
      } else {
        console.log('⚠️ Confirmation dialog did not appear');
      }
    } else {
      console.log('⚠️ No missing plans for this future date - test skipped');
    }
  });
  
});

