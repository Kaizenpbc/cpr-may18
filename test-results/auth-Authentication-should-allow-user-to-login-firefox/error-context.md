# Test info

- Name: Authentication >> should allow user to login
- Location: C:\Users\gerog\Documents\cpr-may18\src\tests\e2e\auth.spec.ts:36:3

# Error details

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="username-input"]') to be visible

    at C:\Users\gerog\Documents\cpr-may18\src\tests\e2e\auth.spec.ts:42:16
```

# Page snapshot

```yaml
- link "Vite logo":
  - /url: https://vite.dev
  - img "Vite logo"
- link "React logo":
  - /url: https://react.dev
  - img "React logo"
- heading "Vite + React" [level=1]
- button "count is 0"
- paragraph:
  - text: Edit
  - code: src/App.tsx
  - text: and save to test HMR
- paragraph: Click on the Vite and React logos to learn more
```

# Test source

```ts
   1 | import { test } from './fixtures';
   2 | import { expect } from '@playwright/test';
   3 |
   4 | test.describe('Authentication', () => {
   5 |   test.beforeEach(async ({ page }) => {
   6 |     // Log console messages for debugging
   7 |     page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
   8 |     page.on('pageerror', err => console.error(`Browser error: ${err.message}`));
   9 |   });
   10 |
   11 |   test('should allow user to register', async ({ page, testData }) => {
   12 |     await page.goto('/register');
   13 |     await page.waitForLoadState('networkidle');
   14 |
   15 |     // Wait for form elements to be ready
   16 |     await page.waitForSelector('[data-testid="username-input"]');
   17 |     await page.waitForSelector('[data-testid="email-input"]');
   18 |     await page.waitForSelector('[data-testid="password-input"]');
   19 |     await page.waitForSelector('[data-testid="confirm-password-input"]');
   20 |     await page.waitForSelector('[data-testid="register-button"]');
   21 |
   22 |     // Fill in registration form
   23 |     await page.locator('[data-testid="username-input"]').fill(testData.user.username);
   24 |     await page.locator('[data-testid="email-input"]').fill(testData.user.email);
   25 |     await page.locator('[data-testid="password-input"]').fill(testData.user.password);
   26 |     await page.locator('[data-testid="confirm-password-input"]').fill(testData.user.password);
   27 |
   28 |     // Submit form
   29 |     await page.locator('[data-testid="register-button"]').click();
   30 |
   31 |     // Verify successful registration
   32 |     await expect(page).toHaveURL('/dashboard');
   33 |     await expect(page.locator('[data-testid="welcome-message"]')).toContainText(testData.user.username);
   34 |   });
   35 |
   36 |   test('should allow user to login', async ({ page, testData }) => {
   37 |     // First register a user
   38 |     await page.goto('/register');
   39 |     await page.waitForLoadState('networkidle');
   40 |
   41 |     // Wait for form elements to be ready
>  42 |     await page.waitForSelector('[data-testid="username-input"]');
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
   43 |     await page.waitForSelector('[data-testid="email-input"]');
   44 |     await page.waitForSelector('[data-testid="password-input"]');
   45 |     await page.waitForSelector('[data-testid="confirm-password-input"]');
   46 |     await page.waitForSelector('[data-testid="register-button"]');
   47 |
   48 |     await page.locator('[data-testid="username-input"]').fill(testData.user.username);
   49 |     await page.locator('[data-testid="email-input"]').fill(testData.user.email);
   50 |     await page.locator('[data-testid="password-input"]').fill(testData.user.password);
   51 |     await page.locator('[data-testid="confirm-password-input"]').fill(testData.user.password);
   52 |     await page.locator('[data-testid="register-button"]').click();
   53 |
   54 |     // Wait for registration to complete
   55 |     await expect(page).toHaveURL('/dashboard');
   56 |
   57 |     // Logout
   58 |     await page.waitForSelector('[data-testid="logout-button"]');
   59 |     await page.locator('[data-testid="logout-button"]').click();
   60 |     await expect(page).toHaveURL('/login');
   61 |
   62 |     // Login
   63 |     await page.waitForSelector('[data-testid="username-input"]');
   64 |     await page.waitForSelector('[data-testid="password-input"]');
   65 |     await page.waitForSelector('[data-testid="login-button"]');
   66 |
   67 |     await page.locator('[data-testid="username-input"]').fill(testData.user.username);
   68 |     await page.locator('[data-testid="password-input"]').fill(testData.user.password);
   69 |     await page.locator('[data-testid="login-button"]').click();
   70 |
   71 |     // Verify successful login
   72 |     await expect(page).toHaveURL('/dashboard');
   73 |     await expect(page.locator('[data-testid="welcome-message"]')).toContainText(testData.user.username);
   74 |   });
   75 |
   76 |   test('should show error for invalid login', async ({ page, unauthenticatedUser }) => {
   77 |     await page.goto('/login');
   78 |     await page.waitForLoadState('networkidle');
   79 |
   80 |     // Wait for form elements to be ready
   81 |     await page.waitForSelector('[data-testid="username-input"]');
   82 |     await page.waitForSelector('[data-testid="password-input"]');
   83 |     await page.waitForSelector('[data-testid="login-button"]');
   84 |
   85 |     // Try to login with invalid credentials
   86 |     await page.locator('[data-testid="username-input"]').fill('invaliduser');
   87 |     await page.locator('[data-testid="password-input"]').fill('invalidpass');
   88 |     await page.locator('[data-testid="login-button"]').click();
   89 |
   90 |     // Verify error message
   91 |     const errorMessage = page.locator('[data-testid="error-message"]');
   92 |     await expect(errorMessage).toBeVisible();
   93 |     await expect(errorMessage).toContainText('Invalid credentials');
   94 |   });
   95 |
   96 |   test('should require authentication for protected routes', async ({ page, unauthenticatedUser }) => {
   97 |     // Try to access dashboard without authentication
   98 |     await page.goto('/dashboard');
   99 |     await page.waitForLoadState('networkidle');
  100 |     
  101 |     // Should be redirected to login
  102 |     await expect(page).toHaveURL('/login');
  103 |   });
  104 |
  105 |   test('should allow access to protected routes when authenticated', async ({ page, authenticatedUser }) => {
  106 |     // Access dashboard with authentication
  107 |     await page.goto('/dashboard');
  108 |     await page.waitForLoadState('networkidle');
  109 |     
  110 |     // Should stay on dashboard
  111 |     await expect(page).toHaveURL('/dashboard');
  112 |   });
  113 |
  114 |   test('should redirect to dashboard after successful login', async ({ page, testData, unauthenticatedUser }) => {
  115 |     // Go to login page
  116 |     await page.goto('/login');
  117 |     await page.waitForLoadState('networkidle');
  118 |     
  119 |     // Wait for form elements to be ready
  120 |     await page.waitForSelector('[data-testid="username-input"]');
  121 |     await page.waitForSelector('[data-testid="password-input"]');
  122 |     await page.waitForSelector('[data-testid="login-button"]');
  123 |     
  124 |     // Fill in login form
  125 |     await page.locator('[data-testid="username-input"]').fill(testData.user.username);
  126 |     await page.locator('[data-testid="password-input"]').fill(testData.user.password);
  127 |     await page.locator('[data-testid="login-button"]').click();
  128 |     
  129 |     // Should be redirected to dashboard
  130 |     await expect(page).toHaveURL('/dashboard');
  131 |   });
  132 | }); 
```