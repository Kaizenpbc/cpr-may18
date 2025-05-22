import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Courses API
export const coursesApi = {
  getAll: () => api.get('/courses'),
  getById: (id: number) => api.get(`/courses/${id}`),
  create: (data: any) => api.post('/courses', data),
  update: (id: number, data: any) => api.put(`/courses/${id}`, data),
  delete: (id: number) => api.delete(`/courses/${id}`),
};

// Sessions API
export const sessionsApi = {
  getAll: () => api.get('/sessions'),
  getById: (id: number) => api.get(`/sessions/${id}`),
  create: (data: any) => api.post('/sessions', data),
  update: (id: number, data: any) => api.put(`/sessions/${id}`, data),
  delete: (id: number) => api.delete(`/sessions/${id}`),
  enroll: (sessionId: number) => api.post(`/sessions/${sessionId}/enroll`),
  cancel: (sessionId: number) => api.post(`/sessions/${sessionId}/cancel`),
};

// Certifications API
export const certificationsApi = {
  getAll: () => api.get('/certifications'),
  getById: (id: number) => api.get(`/certifications/${id}`),
  create: (data: any) => api.post('/certifications', data),
  update: (id: number, data: any) => api.put(`/certifications/${id}`, data),
  delete: (id: number) => api.delete(`/certifications/${id}`),
  download: (id: number) => api.get(`/certifications/${id}/download`, { responseType: 'blob' }),
};

// User API
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (data: any) => api.put('/users/password', data),
};

export interface AvailabilityResponse {
    success: boolean;
    availability: string[];
}

export interface ScheduledClass {
    datescheduled: string;
    course_id: number;
    course_name: string;
    status: string;
}

export interface HolidaysResponse {
    success: boolean;
    holidays: string[];
}

export const getAvailability = async (): Promise<AvailabilityResponse> => {
    try {
        const response = await axios.get('/api/instructor/availability');
        return response.data;
    } catch (error) {
        console.error('Error fetching availability:', error);
        throw error;
    }
};

export const addAvailability = async (date: string): Promise<AvailabilityResponse> => {
    try {
        const response = await axios.post('/api/instructor/availability', { date });
        return response.data;
    } catch (error) {
        console.error('Error adding availability:', error);
        throw error;
    }
};

export const removeAvailability = async (date: string): Promise<AvailabilityResponse> => {
    try {
        const response = await axios.delete(`/api/instructor/availability/${date}`);
        return response.data;
    } catch (error) {
        console.error('Error removing availability:', error);
        throw error;
    }
};

export const getScheduledClasses = async (): Promise<ScheduledClass[]> => {
    try {
        const response = await axios.get('/api/instructor/classes/scheduled');
        return response.data;
    } catch (error) {
        console.error('Error fetching scheduled classes:', error);
        throw error;
    }
};

export const getHolidays = async (): Promise<HolidaysResponse> => {
    try {
        const response = await axios.get('/api/holidays');
        return response.data;
    } catch (error) {
        console.error('Error fetching holidays:', error);
        throw error;
    }
};

export default api; 