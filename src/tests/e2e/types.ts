import type { Page } from '@playwright/test';

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
}

export interface TestData {
  user: {
    username: string;
    email: string;
    password: string;
  };
}

export interface TestFixtures {
  page: Page;
  authenticatedUser: AuthenticatedUser;
  testData: TestData;
  unauthenticatedUser: Record<string, never>;
} 