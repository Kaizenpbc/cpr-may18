# Test info

- Name: User Profile >> should display user profile information
- Location: C:\Users\gerog\Documents\cpr-may18\src\tests\e2e\profile.spec.ts:5:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)

Locator: locator('[data-testid="profile-username"]')
Expected string: "testuser"
Received: <element(s) not found>
Call log:
  - expect.toContainText with timeout 5000ms
  - waiting for locator('[data-testid="profile-username"]')

    at C:\Users\gerog\Documents\cpr-may18\src\tests\e2e\profile.spec.ts:9:68
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
   4 | test.describe('User Profile', () => {
   5 |   test('should display user profile information', async ({ page, authenticatedUser }) => {
   6 |     await page.goto('/profile');
   7 |
   8 |     // Verify profile information is displayed
>  9 |     await expect(page.locator('[data-testid="profile-username"]')).toContainText(authenticatedUser.username);
     |                                                                    ^ Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)
  10 |     await expect(page.locator('[data-testid="profile-email"]')).toContainText(authenticatedUser.email);
  11 |   });
  12 |
  13 |   test('should allow user to update profile', async ({ page, testData }) => {
  14 |     await page.goto('/profile');
  15 |
  16 |     // Update profile information
  17 |     const newEmail = testData.user.email;
  18 |     await page.fill('[data-testid="profile-email-input"]', newEmail);
  19 |     await page.click('[data-testid="save-profile-button"]');
  20 |
  21 |     // Verify success message
  22 |     await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  23 |     await expect(page.locator('[data-testid="success-message"]')).toContainText('Profile updated successfully');
  24 |
  25 |     // Verify updated information
  26 |     await expect(page.locator('[data-testid="profile-email"]')).toContainText(newEmail);
  27 |   });
  28 |
  29 |   test('should validate profile update form', async ({ page }) => {
  30 |     await page.goto('/profile');
  31 |
  32 |     // Try to update with invalid email
  33 |     await page.fill('[data-testid="profile-email-input"]', 'invalid-email');
  34 |     await page.click('[data-testid="save-profile-button"]');
  35 |
  36 |     // Verify validation error
  37 |     await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
  38 |     await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
  39 |   });
  40 |
  41 |   test('should handle profile picture upload', async ({ page }) => {
  42 |     await page.goto('/profile');
  43 |
  44 |     // Upload profile picture
  45 |     const fileInput = page.locator('[data-testid="profile-picture-input"]');
  46 |     await fileInput.setInputFiles({
  47 |       name: 'test-image.jpg',
  48 |       mimeType: 'image/jpeg',
  49 |       buffer: Buffer.from('fake-image-content'),
  50 |     });
  51 |
  52 |     // Verify upload success
  53 |     await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
  54 |     await expect(page.locator('[data-testid="profile-picture"]')).toBeVisible();
  55 |   });
  56 | }); 
```