// Token service for managing authentication tokens

export const tokenService = {
    getAccessToken: () => {
        return localStorage.getItem('accessToken') || null;
    },
    
    setAccessToken: (token) => {
        if (token) {
            localStorage.setItem('accessToken', token);
        }
    },
    
    removeAccessToken: () => {
        localStorage.removeItem('accessToken');
    },
    
    getRefreshToken: () => {
        // For now, we don't store refresh tokens in localStorage for security
        // The backend uses httpOnly cookies for refresh tokens
        return null;
    },
    
    setRefreshToken: (token) => {
        // We don't store refresh tokens in localStorage for security
        // The backend handles refresh tokens via httpOnly cookies
    },
    
    clearTokens: () => {
        localStorage.removeItem('accessToken');
        // Refresh token is cleared by the backend via cookie expiration
    },
    
    isTokenValid: () => {
        const token = tokenService.getAccessToken();
        return !!token;
    }
};

export default tokenService; 