import { api } from './api';
import { tokenService } from './tokenService';

/**
 * Authentication service that handles user authentication operations.
 * Includes methods for login, registration, logout, and token verification.
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
      console.log('[Debug] authService - Attempting login for user:', username);
      const response = await api.post('/api/v1/auth/login', { username, password });
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
    try {
      const token = tokenService.getAccessToken();
      if (!token) return null;

      // Ensure token is set in headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await api.get('/api/v1/auth/me');
      return response.data.data;
    } catch (error) {
      tokenService.clearTokens();
      delete api.defaults.headers.common['Authorization'];
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