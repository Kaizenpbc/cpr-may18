import axios from 'axios';
import { tokenService } from './tokenService';
import type { DashboardMetrics, Class, Availability, ApiResponse, User } from '../types/api';

console.log('[Debug] api.ts - Initializing API service');

const BASE_URL = 'http://localhost:3001';
console.log('[Debug] api.ts - Using API URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Enable cookies for authentication
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenService.getAccessToken();
    console.log('[API REQUEST INTERCEPTOR]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      headers: config.headers,
      data: config.data,
      params: config.params
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API AUTH] Authorization header set with token');
    } else {
      console.log('[API AUTH] No token available, proceeding without auth header');
    }
    
    console.log('[API REQUEST FINAL CONFIG]', {
      method: config.method,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('[API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('[API RESPONSE SUCCESS]', {
      url: response.config.url,
      fullURL: `${response.config.baseURL}${response.config.url}`,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  async (error) => {
    console.error('[API RESPONSE ERROR]', {
      url: error.config?.url,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      message: error.message,
      code: error.code
    });

    if (error.response?.status === 404) {
      console.error('[404 ERROR DETAILS]', {
        requestedURL: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
        method: error.config?.method,
        availableRoutes: 'Check backend routes configuration'
      });
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('[API AUTH] 401 received, attempting token refresh');

      try {
        // Attempt to refresh the token using httpOnly cookie
        // The backend will automatically use the refresh token from the cookie
        const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {}, {
          withCredentials: true // This ensures cookies are sent
        });

        const { accessToken } = response.data.data || response.data;
        if (accessToken) {
          tokenService.setAccessToken(accessToken);
          console.log('[API AUTH] Token refreshed successfully');
          
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          throw new Error('No access token received from refresh');
        }
      } catch (refreshError) {
        console.error('[API AUTH] Token refresh failed:', refreshError);
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
  uploadStudents: async (courseId: number, students: any[]) => {
    const response = await api.post(`/api/v1/organization/courses/${courseId}/students`, { students });
    return response.data;
  },
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

// Accounting and Course Pricing API functions
export const getCoursePricing = async () => {
  const response = await api.get('/api/v1/accounting/course-pricing');
  return response.data;
};

export const updateCoursePrice = async (pricingId: number, data: any) => {
  const response = await api.put(`/api/v1/accounting/course-pricing/${pricingId}`, data);
  return response.data;
};

export const createCoursePricing = async (data: any) => {
  const response = await api.post('/api/v1/accounting/course-pricing', data);
  return response.data;
};

export const getOrganizations = async () => {
  const response = await api.get('/api/v1/accounting/organizations');
  return response.data;
};

// Invoice and Billing API functions
export const getBillingQueue = async () => {
  const response = await api.get('/api/v1/accounting/billing-queue');
  return response.data;
};

export const createInvoice = async (courseId: number) => {
  const response = await api.post('/api/v1/accounting/invoices', { courseId });
  return response.data;
};

export const getInvoices = async () => {
  const response = await api.get('/api/v1/accounting/invoices');
  return response.data.data || [];
};

export const getInvoiceDetails = async (invoiceId: number) => {
  const response = await api.get(`/api/v1/accounting/invoices/${invoiceId}`);
  return response.data;
};

export const updateInvoice = async (invoiceId: number, data: any) => {
  const response = await api.put(`/api/v1/accounting/invoices/${invoiceId}`, data);
  return response.data;
};

export const emailInvoice = async (invoiceId: number) => {
  const response = await api.post(`/api/v1/accounting/invoices/${invoiceId}/email`);
  return response.data;
};

export const getInvoicePayments = async (invoiceId: number) => {
  const response = await api.get(`/api/v1/accounting/invoices/${invoiceId}/payments`);
  return response.data;
};

export const recordInvoicePayment = async (invoiceId: number, paymentData: any) => {
  const response = await api.post(`/api/v1/accounting/invoices/${invoiceId}/payments`, paymentData);
  return response.data;
};

export const getRevenueReport = async (year: number) => {
  const response = await api.get(`/api/v1/accounting/reports/revenue?year=${year}`);
  return response.data;
};

// System Administration API functions
export const sysAdminApi = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/api/v1/sysadmin/dashboard');
    return response.data;
  },

  // Course Management
  getCourses: async () => {
    const response = await api.get('/api/v1/sysadmin/courses');
    return response.data;
  },
  createCourse: async (courseData: any) => {
    const response = await api.post('/api/v1/sysadmin/courses', courseData);
    return response.data;
  },
  updateCourse: async (courseId: number, courseData: any) => {
    const response = await api.put(`/api/v1/sysadmin/courses/${courseId}`, courseData);
    return response.data;
  },
  deleteCourse: async (courseId: number) => {
    const response = await api.delete(`/api/v1/sysadmin/courses/${courseId}`);
    return response.data;
  },

  // User Management
  getUsers: async () => {
    const response = await api.get('/api/v1/sysadmin/users');
    return response.data;
  },
  createUser: async (userData: any) => {
    const response = await api.post('/api/v1/sysadmin/users', userData);
    return response.data;
  },
  updateUser: async (userId: number, userData: any) => {
    const response = await api.put(`/api/v1/sysadmin/users/${userId}`, userData);
    return response.data;
  },
  deleteUser: async (userId: number) => {
    const response = await api.delete(`/api/v1/sysadmin/users/${userId}`);
    return response.data;
  },

  // Vendor Management
  getVendors: async () => {
    const response = await api.get('/api/v1/sysadmin/vendors');
    return response.data;
  },
  createVendor: async (vendorData: any) => {
    const response = await api.post('/api/v1/sysadmin/vendors', vendorData);
    return response.data;
  },
  updateVendor: async (vendorId: number, vendorData: any) => {
    const response = await api.put(`/api/v1/sysadmin/vendors/${vendorId}`, vendorData);
    return response.data;
  },
  deleteVendor: async (vendorId: number) => {
    const response = await api.delete(`/api/v1/sysadmin/vendors/${vendorId}`);
    return response.data;
  },

  // Organization Management
  getOrganizations: async () => {
    const response = await api.get('/api/v1/sysadmin/organizations');
    return response.data;
  },
  createOrganization: async (orgData: any) => {
    const response = await api.post('/api/v1/sysadmin/organizations', orgData);
    return response.data;
  },
  updateOrganization: async (orgId: number, orgData: any) => {
    const response = await api.put(`/api/v1/sysadmin/organizations/${orgId}`, orgData);
    return response.data;
  },
  deleteOrganization: async (orgId: number) => {
    const response = await api.delete(`/api/v1/sysadmin/organizations/${orgId}`);
    return response.data;
  }
};

// Organization Analytics API
export const getOrganizationCourseRequestAnalytics = async (timeframe: string = '12'): Promise<any> => {
  const response = await api.get(`/api/v1/organization/analytics/course-requests?timeframe=${timeframe}`);
  return extractData(response);
};

export const getOrganizationStudentParticipationAnalytics = async (timeframe: string = '12'): Promise<any> => {
  const response = await api.get(`/api/v1/organization/analytics/student-participation?timeframe=${timeframe}`);
  return extractData(response);
};

// Admin endpoints
export const adminApi = {
  getCourseStudents: (courseId: number) => api.get(`/api/v1/admin/courses/${courseId}/students`),
};

export default api;

console.log('[Debug] api.ts - API service initialized'); 