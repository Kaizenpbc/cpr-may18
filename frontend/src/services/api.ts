import axios from 'axios';
import { tokenService } from './tokenService';
import type { DashboardMetrics, Class, Availability, ApiResponse, User } from '../types/api';

console.log('[Debug] api.ts - Initializing API service');

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
console.log('[Debug] api.ts - Using API URL:', API_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: needed to send/receive cookies
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    console.log('[Debug] api.ts - Intercepting request:', config.url);
    const token = tokenService.getToken();
    console.log('[Debug] api.ts - Token present:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Debug] api.ts - Added token to request');
    }
    return config;
  },
  (error) => {
    console.error('[Debug] api.ts - Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('[Debug] api.ts - Response received:', { 
      status: response.status,
      url: response.config.url
    });

    // Check if there's a new token in the Authorization header
    const newToken = response.headers.authorization;
    if (newToken && newToken.startsWith('Bearer ')) {
      const token = newToken.split(' ')[1];
      console.log('[Debug] api.ts - Received new token in header');
      tokenService.setToken(token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    return response;
  },
  async (error) => {
    console.error('[Debug] api.ts - Response error:', error.response?.status, error.config?.url);

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !error.config._retry) {
      console.log('[Debug] api.ts - Attempting to handle 401 error');
      error.config._retry = true;

      try {
        // The auth middleware will handle token refresh automatically
        // Just retry the original request
        console.log('[Debug] api.ts - Retrying original request');
        const retryResponse = await api(error.config);
        
        // Check if we got a new token in the retry response
        const newToken = retryResponse.headers.authorization;
        if (newToken && newToken.startsWith('Bearer ')) {
          const token = newToken.split(' ')[1];
          console.log('[Debug] api.ts - Received new token from retry');
          tokenService.setToken(token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        return retryResponse;
      } catch (retryError) {
        console.error('[Debug] api.ts - Request retry failed:', retryError);
        
        // If the retry also failed with 401, clear token and redirect to login
        if (axios.isAxiosError(retryError) && retryError.response?.status === 401) {
          console.log('[Debug] api.ts - Retry failed with 401, clearing token and redirecting');
          tokenService.clearToken();
          delete api.defaults.headers.common['Authorization'];
          window.location.href = '/login';
        }
        
        return Promise.reject(retryError);
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to extract data from API response
const extractData = <T>(response: { data: ApiResponse<T> }): T => {
  if (response.data.status === 'error') {
    throw new Error(response.data.message || 'API Error');
  }
  return response.data.data;
};

// Dashboard endpoints
export const fetchDashboardData = async (): Promise<DashboardMetrics> => {
  console.log('[Debug] api.ts - Fetching dashboard data');
  try {
    const token = tokenService.getToken();
    console.log('[Debug] api.ts - Auth token present:', !!token);
    console.log('[Debug] api.ts - Base URL:', API_URL);
    console.log('[Debug] api.ts - Endpoint:', '/api/v1/dashboard');
    const response = await api.get<ApiResponse<DashboardMetrics>>('/api/v1/dashboard');
    const data = extractData(response);
    console.log('[Debug] api.ts - Dashboard data received:', data);
    return data;
  } catch (error) {
    console.error('[Debug] api.ts - Error fetching dashboard data:', error);
    if (axios.isAxiosError(error)) {
      console.error('[Debug] api.ts - Response status:', error.response?.status);
      console.error('[Debug] api.ts - Response data:', error.response?.data);
    }
    throw error;
  }
};

// Auth endpoints
export const logout = async (): Promise<void> => {
  console.log('[Debug] api.ts - Logging out');
  try {
    await api.post('/api/v1/auth/logout');
    console.log('[Debug] api.ts - Logout successful');
  } catch (error) {
    console.error('[Debug] api.ts - Logout error:', error);
    // Still remove token even if logout fails
    tokenService.clearToken();
  }
};

// Schedule endpoints
export const fetchInstructorAvailability = async (): Promise<Availability[]> => {
  console.log('[Debug] api.ts - Fetching instructor availability');
  const response = await api.get<ApiResponse<Availability[]>>('/api/v1/instructor/availability');
  return extractData(response);
};

export const updateInstructorAvailability = async (availability: Partial<Availability>): Promise<Availability> => {
  console.log('[Debug] api.ts - Updating instructor availability');
  const response = await api.post<ApiResponse<Availability>>('/api/v1/instructor/availability', availability);
  return extractData(response);
};

export const fetchSchedule = async (): Promise<Class[]> => {
  console.log('[Debug] api.ts - Fetching schedule');
  const response = await api.get<ApiResponse<Class[]>>('/api/v1/schedule');
  return extractData(response);
};

// Attendance endpoints
export const fetchAttendance = async (classId: string): Promise<{ present: string[] }> => {
  console.log('[Debug] api.ts - Fetching attendance for class:', classId);
  const response = await api.get<ApiResponse<{ present: string[] }>>(`/api/v1/attendance/${classId}`);
  return extractData(response);
};

export const updateAttendance = async (classId: string, attendance: { present: string[] }): Promise<{ present: string[] }> => {
  console.log('[Debug] api.ts - Updating attendance for class:', classId);
  const response = await api.post<ApiResponse<{ present: string[] }>>(`/api/v1/attendance/${classId}`, attendance);
  return extractData(response);
};

// Password reset endpoints
export const requestPasswordReset = async (email: string): Promise<void> => {
  console.log('[Debug] api.ts - Requesting password reset for email:', email);
  try {
    await api.post('/api/v1/auth/forgot-password', { email });
    console.log('[Debug] api.ts - Password reset request successful');
  } catch (error) {
    console.error('[Debug] api.ts - Password reset request error:', error);
    throw error;
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  console.log('[Debug] api.ts - Resetting password with token');
  try {
    await api.post('/api/v1/auth/reset-password', { token, newPassword });
    console.log('[Debug] api.ts - Password reset successful');
  } catch (error) {
    console.error('[Debug] api.ts - Password reset error:', error);
    throw error;
  }
};

// Export the api instance for use in other services
export default api;

console.log('[Debug] api.ts - API service initialized'); 