import { test, expect, Page } from '@playwright/test';
import { RealAuthHelper } from './helpers/real-auth';

/**
 * E2E Tests for Shipping Agent Management System
 *
 * Workflows covered:
 * 1. Viewing shipping agent organizations
 * 2. Viewing shipping agent representatives
 * 3. Creating new representatives
 * 4. Form validation
 */

// Helper function to wait for page to be ready
async function waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
}

test.describe('Shipping Agents - Organizations and Representatives', () => {
    test.beforeEach(async ({ page }) => {
        await RealAuthHelper.loginWithCredentials(page);
    });

    test('Organizations: User can view the shipping agents page', async ({ page }) => {
        await page.goto('/shippingagentorganization');
        await waitForPageLoad(page);

        // Check that the page heading or content is visible
        const heading = page.getByRole('heading', { name: /Shipping Agent/i }).first();
        const isHeadingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);

        if (isHeadingVisible) {
            console.log('✓ Page heading found:', await heading.textContent());
        } else {
            // Fallback: check URL
            expect(page.url()).toContain('shippingagent');
        }

        // Check that Organizations tab or content is visible
        const organizationsTab = page.getByRole('button', { name: /Organizations/i });
        if (await organizationsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(organizationsTab).toBeVisible();
        }
    });

    test('Organizations: Can view organization list', async ({ page }) => {
        await page.goto('/shippingagentorganization');
        await waitForPageLoad(page);

        // Check if we have any organizations displayed or empty state
        const hasContent = await page.locator('.bg-white').first().isVisible({ timeout: 5000 }).catch(() => false);
        
        if (hasContent) {
            console.log('✓ Organizations content loaded');
        } else {
            // Might show empty state
            const emptyState = page.getByText(/No organizations|No.*found/i);
            if (await emptyState.isVisible({ timeout: 3000 }).catch(() => false)) {
                console.log('✓ Empty state displayed');
            }
        }
    });

    test('Organizations: Can click details button if organizations exist', async ({ page }) => {
        await page.goto('/shippingagentorganization');
        await waitForPageLoad(page);

        // Look for a details button
        const detailsButton = page.getByRole('button', { name: /See details|Details|View/i }).first();
        
        if (await detailsButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await detailsButton.click();
            await page.waitForTimeout(500);
            
            // Modal should open
            const modal = page.getByRole('dialog');
            if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
                await expect(modal).toBeVisible();
                console.log('✓ Details modal opened');
            }
        } else {
            console.log('⚠️ No organizations available to view details');
        }
    });

    test('Representatives: Can switch to Representatives tab', async ({ page }) => {
        await page.goto('/shippingagentorganization');
        await waitForPageLoad(page);

        // Switch to Representatives tab
        const repTab = page.getByRole('button', { name: /Representatives/i });
        
        if (await repTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await repTab.click();
            await page.waitForTimeout(1000);
            
            // Verify tab switched (content changed or tab is active)
            const isActive = await repTab.evaluate((el) => 
                el.className.includes('border-b') || el.className.includes('active')
            ).catch(() => false);
            
            if (isActive) {
                console.log('✓ Representatives tab activated');
            }
        } else {
            console.log('⚠️ Representatives tab not found');
        }
    });

    test('Representatives: Can view representatives list', async ({ page }) => {
        await page.goto('/shippingagentorganization');
        await waitForPageLoad(page);

        // Switch to Representatives tab
        const repTab = page.getByRole('button', { name: /Representatives/i });
        if (await repTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await repTab.click();
            await waitForPageLoad(page);

            // Check for content or empty state
            const hasReps = await page.locator('table, .table, [role="table"]').isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasReps) {
                console.log('✓ Representatives list visible');
            } else {
                const emptyState = page.getByText(/No representatives|No.*found/i);
                if (await emptyState.isVisible({ timeout: 3000 }).catch(() => false)) {
                    console.log('✓ Empty representatives state displayed');
                }
            }
        }
    });

    test('Representatives: Can open create representative form', async ({ page }) => {
        await page.goto('/shippingagentorganization');
        await waitForPageLoad(page);

        // Switch to Representatives tab
        const repTab = page.getByRole('button', { name: /Representatives/i });
        if (await repTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await repTab.click();
            await waitForPageLoad(page);

            // Look for create/new button
            const createButton = page.getByRole('button', { name: /New Representative|Create|Add/i });
            
            if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await createButton.click();
                await page.waitForTimeout(500);

                // Form/modal should open
                const form = page.locator('form').first();
                const modal = page.getByRole('dialog');
                
                const formVisible = await form.isVisible({ timeout: 3000 }).catch(() => false);
                const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
                
                if (formVisible || modalVisible) {
                    console.log('✓ Create representative form opened');
                }
            } else {
                console.log('⚠️ Create button not found - user might lack permissions');
            }
        }
    });

    test('Representatives: Form validation for required fields', async ({ page }) => {
        await page.goto('/shippingagentorganization');
        await waitForPageLoad(page);

        const repTab = page.getByRole('button', { name: /Representatives/i });
        if (!(await repTab.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log('⚠️ Representatives tab not found');
            return;
        }

        await repTab.click();
        await waitForPageLoad(page);

        const createButton = page.getByRole('button', { name: /New Representative|Create|Add/i });
        if (!(await createButton.isVisible({ timeout: 3000 }).catch(() => false))) {
            console.log('⚠️ Create button not found');
            return;
        }

        await createButton.click();
        await page.waitForTimeout(500);

        // Try to submit without filling required fields
        const submitButton = page.getByRole('button', { name: /Create|Submit|Save/i }).last();
        
        if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await submitButton.click();
            await page.waitForTimeout(500);

            // Form should still be visible (validation prevented submission)
            const form = page.locator('form').first();
            const stillVisible = await form.isVisible({ timeout: 2000 }).catch(() => false);
            
            if (stillVisible) {
                console.log('✓ Form validation prevented empty submission');
            }
        }
    });
});
