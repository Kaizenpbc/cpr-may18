import axios from 'axios';
import { tokenService } from './tokenService';
import type { DashboardMetrics, Class, Availability, ApiResponse, User } from '../types/api';

console.log('[Debug] api.ts - Initializing API service');

const BASE_URL = 'http://localhost:3001';
console.log('[Debug] api.ts - Using API URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenService.getAccessToken();
    console.log('[Debug] API Interceptor - Token available:', !!token);
    console.log('[Debug] API Interceptor - Request URL:', config.url);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Debug] API Interceptor - Authorization header set');
    } else {
      console.log('[Debug] API Interceptor - No token available, skipping auth header');
    }
    return config;
  },
  (error) => {
    console.error('[Debug] API Interceptor - Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const refreshToken = tokenService.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken } = response.data;
        tokenService.setAccessToken(accessToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and reject
        tokenService.clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to extract data from API response (new format)
const extractData = <T>(response: { data: { success: boolean; data: T; error?: any; message?: string } }): T => {
  if (response.data.success === false) {
    throw new Error(response.data.error?.message || response.data.message || 'API Error');
  }
  return response.data.data;
};

// Helper function for legacy API responses (old format)
const extractLegacyData = <T>(response: { data: ApiResponse<T> }): T => {
  if (response.data.status === 'error') {
    throw new Error(response.data.message || 'API Error');
  }
  return response.data.data;
};

// Dashboard endpoints
export const fetchDashboardData = async (): Promise<DashboardMetrics> => {
  console.log('[Debug] api.ts - Fetching dashboard data');
  try {
    const token = tokenService.getAccessToken();
    console.log('[Debug] api.ts - Auth token present:', !!token);
    console.log('[Debug] api.ts - Base URL:', BASE_URL);
    console.log('[Debug] api.ts - Endpoint:', '/api/v1/dashboard');
    const response = await api.get<ApiResponse<DashboardMetrics>>('/api/v1/dashboard');
    const data = extractLegacyData(response);
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
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/api/v1/auth/login', { username, password }),
  logout: () => api.post('/api/v1/auth/logout'),
  refreshToken: () => api.post('/api/v1/auth/refresh'),
};

// Password reset functions
export const requestPasswordReset = async (email: string) => {
  const response = await api.post('/api/v1/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, password: string) => {
  const response = await api.post('/api/v1/auth/reset-password', { token, password });
  return response.data;
};

// Course admin endpoints
export const courseAdminApi = {
  // Courses
  getCourses: () => api.get('/api/v1/courses'),
  createCourse: (data: any) => api.post('/api/v1/courses', data),
  updateCourse: (id: number, data: any) => api.put(`/api/v1/courses/${id}`, data),
  deleteCourse: (id: number) => api.delete(`/api/v1/courses/${id}`),
  assignInstructor: (courseId: number, instructorId: number) => 
    api.put(`/api/v1/courses/${courseId}/assign-instructor`, { instructorId }),

  // Classes
  getClasses: () => api.get('/api/v1/classes'),
  createClass: (data: any) => api.post('/api/v1/classes', data),
  updateClass: (id: number, data: any) => api.put(`/api/v1/classes/${id}`, data),
  deleteClass: (id: number) => api.delete(`/api/v1/classes/${id}`),

  // Instructors
  getInstructors: () => api.get('/api/v1/instructors'),
  createInstructor: (data: any) => api.post('/api/v1/instructors', data),
  updateInstructor: (id: number, data: any) => api.put(`/api/v1/instructors/${id}`, data),
  deleteInstructor: (id: number) => api.delete(`/api/v1/instructors/${id}`),
  updateInstructorAvailability: (id: number, data: any) =>
    api.put(`/api/v1/instructors/${id}/availability`, data),
};

// Organization endpoints
export const organizationApi = {
  requestCourse: (data: any) => api.post('/api/v1/organization/course-request', data),
  getMyCourses: async () => {
    const response = await api.get('/api/v1/organization/courses');
    return extractData(response);
  },
  getCourseStudents: (courseId: number) => api.get(`/api/v1/organization/courses/${courseId}/students`),
};

// Course types endpoint
export const getCourseTypes = async () => {
  const response = await api.get('/api/v1/course-types');
  return extractData(response);
};

// Organization course request method (for backward compatibility with ScheduleCourseForm)
export const requestCourse = async (data: any) => {
  const response = await api.post('/api/v1/organization/course-request', data);
  return response.data;
};

// Student endpoints
export const studentApi = {
  getSchedule: () => api.get('/api/v1/student/schedule'),
  enrollInClass: (classId: number) => api.post(`/api/v1/student/enroll/${classId}`),
  withdrawFromClass: (classId: number) => api.delete(`/api/v1/student/withdraw/${classId}`),
};

// Instructor endpoints
export const instructorApi = {
  getSchedule: () => api.get('/api/v1/instructor/schedule'),
  getAvailability: () => api.get('/api/v1/instructor/availability'),
  updateAvailability: (data: any) => api.put('/api/v1/instructor/availability', data),
};

// Additional exports for backward compatibility
export const fetchInstructorAvailability = async (): Promise<Availability[]> => {
  const response = await api.get<ApiResponse<Availability[]>>('/api/v1/instructor/availability');
  return extractLegacyData(response);
};

export const fetchSchedule = async (): Promise<Class[]> => {
  const response = await api.get<ApiResponse<Class[]>>('/api/v1/instructor/schedule');
  return extractLegacyData(response);
};

// Export the api instance for use in other services
export { api };

console.log('[Debug] api.ts - API service initialized'); 