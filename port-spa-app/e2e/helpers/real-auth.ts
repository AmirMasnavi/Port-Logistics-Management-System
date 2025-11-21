import { Page } from '@playwright/test';

/**
 * Real Authentication Helper for E2E Tests
 * 
 * This helper performs REAL authentication through Firebase
 * using the credentials you provided: 1221579@isep.ipp.pt / 123456
 */

export class RealAuthHelper {
  /**
   * Login using email and password through the UI
   */
  static async loginWithCredentials(
    page: Page, 
    email: string = '1221579@isep.ipp.pt', 
    password: string = '123456'
  ) {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for login button/link in navigation
    const loginButton = page.locator('button:has-text("Login"), a:has-text("Login"), button:has-text("Sign In")').first();
    
    if (await loginButton.isVisible({ timeout: 3000 })) {
      await loginButton.click();
      
      // Wait for login modal/form to appear
      await page.waitForTimeout(1000);
      
      // Fill in email and password using aria-label (more reliable)
      const emailInput = page.locator('input[type="email"], input[aria-label="Email"]').first();
      const passwordInput = page.locator('input[type="password"], input[aria-label="Password"]').first();
      
      await emailInput.fill(email);
      await passwordInput.fill(password);
      
      console.log(`✅ Filled credentials: ${email}`);
      
      // Submit the form - press Enter on password field
      await passwordInput.press('Enter');
      
      console.log('✅ Submitted login form');
      
      // Wait for authentication to complete
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Give Firebase time to authenticate
      
      console.log(`✅ Logged in as: ${email}`);
    } else {
      console.log('ℹ️ Already logged in or login button not found');
    }
  }

  /**
   * Login as Admin (default credentials)
   */
  static async loginAsAdmin(page: Page) {
    await this.loginWithCredentials(page, '1221579@isep.ipp.pt', '123456');
  }

  /**
   * Check if user is logged in by looking for user-specific elements
   */
  static async isLoggedIn(page: Page): Promise<boolean> {
    try {
      // Check for common logged-in indicators
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
      const userMenu = page.locator('[aria-label*="user" i], [class*="user-menu" i]').first();
      
      return (
        (await logoutButton.isVisible({ timeout: 1000 })) ||
        (await userMenu.isVisible({ timeout: 1000 }))
      );
    } catch {
      return false;
    }
  }

  /**
   * Ensure user is logged in, login if not
   */
  static async ensureLoggedIn(page: Page) {
    const loggedIn = await this.isLoggedIn(page);
    if (!loggedIn) {
      console.log('🔐 Not logged in, authenticating...');
      await this.loginAsAdmin(page);
    } else {
      console.log('✅ Already authenticated');
    }
  }

  /**
   * Logout
   */
  static async logout(page: Page) {
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
    if (await logoutButton.isVisible({ timeout: 2000 })) {
      await logoutButton.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Logged out');
    }
  }
}

/**
 * Alternative: Use Firebase Auth directly via page.evaluate
 * This bypasses the UI and directly authenticates with Firebase
 */
export class DirectFirebaseAuth {
  static async loginWithFirebase(
    page: Page,
    email: string = '1221579@isep.ipp.pt',
    password: string = '123456'
  ) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Execute Firebase auth directly in the browser context
    await page.evaluate(async ({ email, password }) => {
      // @ts-ignore - Firebase is loaded in the page
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      // @ts-ignore
      const { auth } = await import('./firebaseConfig');
      
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Firebase auth successful');
      } catch (error) {
        console.error('Firebase auth failed:', error);
        throw error;
      }
    }, { email, password });

    await page.waitForTimeout(2000);
    console.log(`✅ Authenticated via Firebase: ${email}`);
  }
}
