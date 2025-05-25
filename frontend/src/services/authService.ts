import { api } from './api.ts';
import { tokenService } from './tokenService';

// Add request deduplication for auth checks
let authCheckPromise: Promise<any> | null = null;

/**
 * Authentication service that handles user authentication operations.
 * Includes methods for login, registration, logout, and token verification.
 * Updated to force module cache refresh.
 */
export const authService = {
  /**
   * Authenticates a user with username and password.
   * @param username - The user's username
   * @param password - The user's password
   * @returns Promise with the authentication response
   * @throws Error if authentication fails
   */
  async login(username: string, password: string) {
    try {
      // Trim whitespace from username to prevent authentication issues
      const trimmedUsername = username.trim();
      console.log('[Debug] authService - Attempting login for user:', trimmedUsername);
      const response = await api.post('/api/v1/auth/login', { username: trimmedUsername, password });
      const { accessToken, refreshToken, user } = response.data.data;
      
      // Store the tokens
      if (accessToken) {
        console.log('[Debug] authService - Received access token, storing');
        tokenService.setAccessToken(accessToken);
        // Ensure the token is set in the API instance
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }

      if (refreshToken) {
        console.log('[Debug] authService - Received refresh token, storing');
        tokenService.setRefreshToken(refreshToken);
      }
      
      return { user, accessToken, refreshToken };
    } catch (error) {
      console.error('[Debug] authService - Login error:', error);
      throw error;
    }
  },

  /**
   * Registers a new user.
   * @param username - The new user's username
   * @param email - The new user's email
   * @param password - The new user's password
   * @returns Promise with the registration response
   * @throws Error if registration fails
   */
  async register(username: string, email: string, password: string) {
    try {
      const response = await api.post('/api/v1/auth/register', {
        username,
        email,
        password,
      });
      const { accessToken, refreshToken, user } = response.data.data;
      
      // Store the tokens
      if (accessToken) {
        tokenService.setAccessToken(accessToken);
        // Ensure the token is set in the API instance
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }

      if (refreshToken) {
        tokenService.setRefreshToken(refreshToken);
      }
      
      return { user, accessToken, refreshToken };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logs out the current user.
   * Clears the access token from memory and the refresh token cookie.
   */
  async logout() {
    try {
      const token = tokenService.getAccessToken();
      if (token) {
        await api.post('/api/v1/auth/logout');
      }
      // Clear tokens from storage and API instance
      tokenService.clearTokens();
      delete api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear tokens on error
      tokenService.clearTokens();
      delete api.defaults.headers.common['Authorization'];
    }
  },

  /**
   * Verifies the current authentication status.
   * @returns Promise with the verification response or false if not authenticated
   */
  async checkAuth() {
    // Return existing promise if one is already in progress
    if (authCheckPromise) {
      console.log('[Debug] authService - Returning existing auth check promise');
      return authCheckPromise;
    }

    try {
      const token = tokenService.getAccessToken();
      if (!token) {
        console.log('[Debug] authService - No access token found');
        return null;
      }

      // Ensure token is set in headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('[Debug] authService - Checking authentication with backend');
      
      // Create and cache the promise
      authCheckPromise = api.get('/api/v1/auth/me').then(response => {
        // Backend returns { success: true, data: { user: {...} } }
        const userData = response.data.data.user;
        console.log('[Debug] authService - Authentication check successful for user:', userData.username);
        authCheckPromise = null; // Clear the promise cache
        return userData;
      }).catch(error => {
        console.error('[Debug] authService - Authentication check failed:', error.response?.status, error.message);
        
        // Only clear tokens if we get a 401 (unauthorized) or 403 (forbidden)
        // Other errors (network issues, server errors) should not clear valid tokens
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('[Debug] authService - Clearing tokens due to authentication failure');
          tokenService.clearTokens();
          delete api.defaults.headers.common['Authorization'];
        } else {
          console.log('[Debug] authService - Network/server error, keeping tokens');
          // Don't clear tokens for network errors - user might just be offline
        }
        
        authCheckPromise = null; // Clear the promise cache
        return null;
      });
      
      return authCheckPromise;
    } catch (error: any) {
      authCheckPromise = null; // Clear the promise cache on any error
      console.error('[Debug] authService - Unexpected error in checkAuth:', error);
      return null;
    }
  },

  /**
   * Gets the current access token.
   * @returns The current access token or null if not authenticated
   */
  getAccessToken() {
    return tokenService.getAccessToken();
  },

  /**
   * Checks if the user is currently authenticated.
   * @returns boolean indicating if the user is authenticated
   */
  isAuthenticated() {
    const token = this.getAccessToken();
    return !!token;
  }
}; 