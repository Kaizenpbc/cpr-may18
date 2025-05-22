console.log('Initializing tokenService');

const TOKEN_KEY = 'auth_token';

/**
 * Token service that handles access token storage and retrieval.
 * This is kept separate from authService to avoid circular dependencies.
 */
export const tokenService = {
    /**
     * Gets the current access token from localStorage.
     * @returns The current access token or null if not found
     */
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Sets the access token in localStorage.
     * @param token - The access token to store
     */
    setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
    },

    /**
     * Clears the access token from localStorage.
     */
    clearToken(): void {
        localStorage.removeItem(TOKEN_KEY);
    },

    /**
     * Gets the authorization header with the current token
     */
    getAuthHeader() {
        const token = this.getToken();
        console.log('[TRACE] Getting auth header - Token exists:', !!token);
        return token ? { Authorization: `Bearer ${token}` } : {};
    },

    hasToken(): boolean {
        return !!this.getToken();
    }
};

console.log('TokenService initialized'); 