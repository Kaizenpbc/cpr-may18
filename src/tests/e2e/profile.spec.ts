import { test } from './fixtures';
import { expect } from '@playwright/test';

test.describe('User Profile', () => {
  test('should display user profile information', async ({ page, authenticatedUser }) => {
    await page.goto('/profile');

    // Verify profile information is displayed
    await expect(page.locator('[data-testid="profile-username"]')).toContainText(authenticatedUser.username);
    await expect(page.locator('[data-testid="profile-email"]')).toContainText(authenticatedUser.email);
  });

  test('should allow user to update profile', async ({ page, testData }) => {
    await page.goto('/profile');

    // Update profile information
    const newEmail = testData.user.email;
    await page.fill('[data-testid="profile-email-input"]', newEmail);
    await page.click('[data-testid="save-profile-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Profile updated successfully');

    // Verify updated information
    await expect(page.locator('[data-testid="profile-email"]')).toContainText(newEmail);
  });

  test('should validate profile update form', async ({ page }) => {
    await page.goto('/profile');

    // Try to update with invalid email
    await page.fill('[data-testid="profile-email-input"]', 'invalid-email');
    await page.click('[data-testid="save-profile-button"]');

    // Verify validation error
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
  });

  test('should handle profile picture upload', async ({ page }) => {
    await page.goto('/profile');

    // Upload profile picture
    const fileInput = page.locator('[data-testid="profile-picture-input"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-content'),
    });

    // Verify upload success
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-picture"]')).toBeVisible();
  });
}); 