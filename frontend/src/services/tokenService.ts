console.log('Initializing tokenService');

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const LAST_LOCATION_KEY = 'lastLocation';

/**
 * Token service that handles access token storage and retrieval.
 * This is kept separate from authService to avoid circular dependencies.
 */
export const tokenService = {
    /**
     * Gets the current access token from localStorage.
     * @returns The current access token or null if not found
     */
    getAccessToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },

    /**
     * Sets the access token in localStorage.
     * @param token - The access token to store
     */
    setAccessToken(token: string): void {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    },

    /**
     * Gets the current refresh token from localStorage.
     * @returns The current refresh token or null if not found
     */
    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    /**
     * Sets the refresh token in localStorage.
     * @param token - The refresh token to store
     */
    setRefreshToken(token: string): void {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
    },

    /**
     * Saves the current location for restoration after login
     * @param location - The current pathname to save
     */
    saveCurrentLocation(location: string): void {
        // Don't save login/auth pages
        if (!location.includes('/login') && !location.includes('/forgot-password') && !location.includes('/reset-password')) {
            localStorage.setItem(LAST_LOCATION_KEY, location);
        }
    },

    /**
     * Gets the saved location for restoration after login
     * @returns The saved location or null
     */
    getSavedLocation(): string | null {
        return localStorage.getItem(LAST_LOCATION_KEY);
    },

    /**
     * Clears the saved location
     */
    clearSavedLocation(): void {
        localStorage.removeItem(LAST_LOCATION_KEY);
    },

    /**
     * Clears both access and refresh tokens from localStorage.
     * This version does NOT force redirect - let React Router handle navigation
     */
    clearTokens(): void {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        // Note: We do NOT clear all localStorage or force navigation
        // This allows the app to maintain state and handle routing properly
    },

    /**
     * Checks if both access and refresh tokens exist in localStorage.
     * @returns true if both tokens exist, false otherwise
     */
    hasTokens(): boolean {
        return !!(localStorage.getItem(ACCESS_TOKEN_KEY) && localStorage.getItem(REFRESH_TOKEN_KEY));
    },

    /**
     * Gets the authorization header with the current access token
     */
    getAuthHeader() {
        const token = this.getAccessToken();
        console.log('[TRACE] Getting auth header - Token exists:', !!token);
        return token ? { Authorization: `Bearer ${token}` } : {};
    },

    /**
     * Force clear all authentication and redirect to login
     * Can be called from browser console: tokenService.forceLogout()
     * This is the only method that should force navigation
     */
    forceLogout(): void {
        // Save current location before clearing
        this.saveCurrentLocation(window.location.pathname);
        
        // Clear tokens
        this.clearTokens();
        
        // Clear all localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Force a hard refresh to login
        window.location.href = '/login';
    }
};

console.log('TokenService initialized');

// Make tokenService globally available for debugging
(window as any).tokenService = tokenService; 