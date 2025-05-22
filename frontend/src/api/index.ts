import axios from 'axios';
import { tokenService } from '../services/tokenService';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('[Debug] API - Adding auth token to request');
    const token = tokenService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure content type is set for POST requests
    if (config.method === 'post') {
      config.headers['Content-Type'] = 'application/json';
    }
    console.log('[Debug] API - Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('[Debug] API - Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('[Debug] API - Response received:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('[Debug] API - Response error:', error.response || error);
    
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('[Debug] API - Attempting token refresh');

      try {
        const response = await axios.post('http://localhost:3001/api/v1/auth/refresh', {}, {
          withCredentials: true
        });
        
        if (response.data?.data?.accessToken) {
          const { accessToken } = response.data.data;
          console.log('[Debug] API - Token refresh successful');
          
          tokenService.setToken(accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('[Debug] API - Token refresh failed:', refreshError);
      }
      
      // If we get here, either refresh failed or no new token was received
      console.log('[Debug] API - Clearing token and redirecting to login');
      tokenService.clearToken();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api; 