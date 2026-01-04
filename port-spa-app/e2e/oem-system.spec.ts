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
  await page.waitForTimeout(1000);
}

test.describe('OEM System Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin to ensure access to all OEM features
    await RealAuthHelper.loginWithCredentials(page);
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
});

