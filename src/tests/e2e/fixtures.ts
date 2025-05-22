import { test as base } from '@playwright/test';
import type { TestFixtures } from './types';

// Extend the base test with our custom fixtures
export const test = base.extend<TestFixtures>({
  // Add a fixture for test data
  testData: async ({}, use) => {
    // Provide test data to the test
    await use({
      user: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpass123'
      }
    });
  },

  // Add a fixture for authenticated user
  authenticatedUser: async ({ page, testData }, use) => {
    // Mock authentication by setting a token in localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mock-token');
      window.localStorage.setItem('user', JSON.stringify({
        id: 1,
        username: testData.user.username,
        email: testData.user.email
      }));
    });

    // Pass the user data to the test
    await use({
      id: 1,
      username: testData.user.username,
      email: testData.user.email
    });

    // Cleanup
    await page.evaluate(() => {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    });
  },

  // Add a fixture for unauthenticated state
  unauthenticatedUser: async ({ page }, use) => {
    // Clear any existing authentication
    await page.addInitScript(() => {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    });

    await use({});
  }
}); 