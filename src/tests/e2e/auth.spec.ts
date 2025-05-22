import { test } from './fixtures';
import { expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Log console messages for debugging
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    page.on('pageerror', err => console.error(`Browser error: ${err.message}`));
  });

  test('should allow user to register', async ({ page, testData }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Wait for form elements to be ready
    await page.waitForSelector('[data-testid="username-input"]');
    await page.waitForSelector('[data-testid="email-input"]');
    await page.waitForSelector('[data-testid="password-input"]');
    await page.waitForSelector('[data-testid="confirm-password-input"]');
    await page.waitForSelector('[data-testid="register-button"]');

    // Fill in registration form
    await page.locator('[data-testid="username-input"]').fill(testData.user.username);
    await page.locator('[data-testid="email-input"]').fill(testData.user.email);
    await page.locator('[data-testid="password-input"]').fill(testData.user.password);
    await page.locator('[data-testid="confirm-password-input"]').fill(testData.user.password);

    // Submit form
    await page.locator('[data-testid="register-button"]').click();

    // Verify successful registration
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText(testData.user.username);
  });

  test('should allow user to login', async ({ page, testData }) => {
    // First register a user
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Wait for form elements to be ready
    await page.waitForSelector('[data-testid="username-input"]');
    await page.waitForSelector('[data-testid="email-input"]');
    await page.waitForSelector('[data-testid="password-input"]');
    await page.waitForSelector('[data-testid="confirm-password-input"]');
    await page.waitForSelector('[data-testid="register-button"]');

    await page.locator('[data-testid="username-input"]').fill(testData.user.username);
    await page.locator('[data-testid="email-input"]').fill(testData.user.email);
    await page.locator('[data-testid="password-input"]').fill(testData.user.password);
    await page.locator('[data-testid="confirm-password-input"]').fill(testData.user.password);
    await page.locator('[data-testid="register-button"]').click();

    // Wait for registration to complete
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.waitForSelector('[data-testid="logout-button"]');
    await page.locator('[data-testid="logout-button"]').click();
    await expect(page).toHaveURL('/login');

    // Login
    await page.waitForSelector('[data-testid="username-input"]');
    await page.waitForSelector('[data-testid="password-input"]');
    await page.waitForSelector('[data-testid="login-button"]');

    await page.locator('[data-testid="username-input"]').fill(testData.user.username);
    await page.locator('[data-testid="password-input"]').fill(testData.user.password);
    await page.locator('[data-testid="login-button"]').click();

    // Verify successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText(testData.user.username);
  });

  test('should show error for invalid login', async ({ page, unauthenticatedUser }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for form elements to be ready
    await page.waitForSelector('[data-testid="username-input"]');
    await page.waitForSelector('[data-testid="password-input"]');
    await page.waitForSelector('[data-testid="login-button"]');

    // Try to login with invalid credentials
    await page.locator('[data-testid="username-input"]').fill('invaliduser');
    await page.locator('[data-testid="password-input"]').fill('invalidpass');
    await page.locator('[data-testid="login-button"]').click();

    // Verify error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Invalid credentials');
  });

  test('should require authentication for protected routes', async ({ page, unauthenticatedUser }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('should allow access to protected routes when authenticated', async ({ page, authenticatedUser }) => {
    // Access dashboard with authentication
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should stay on dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should redirect to dashboard after successful login', async ({ page, testData, unauthenticatedUser }) => {
    // Go to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Wait for form elements to be ready
    await page.waitForSelector('[data-testid="username-input"]');
    await page.waitForSelector('[data-testid="password-input"]');
    await page.waitForSelector('[data-testid="login-button"]');
    
    // Fill in login form
    await page.locator('[data-testid="username-input"]').fill(testData.user.username);
    await page.locator('[data-testid="password-input"]').fill(testData.user.password);
    await page.locator('[data-testid="login-button"]').click();
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
}); 