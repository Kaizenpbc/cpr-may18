import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getHeaders, getAuthHeader, getCSRFToken, verifyToken, checkBackendHealth } from '../config';
import api from '../api';
import authService from '../../services/authService';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  },
}));

vi.mock('../../services/authService', () => ({
  default: {
    getAuthHeader: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('API Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getHeaders', () => {
    it('returns headers with auth token when available', () => {
      const mockToken = 'test-token';
      localStorage.setItem('authToken', mockToken);
      const headers = getHeaders();
      expect(headers).toHaveProperty('Authorization', `Bearer ${mockToken}`);
      expect(headers).toHaveProperty('Content-Type', 'application/json');
    });

    it('returns headers without auth token when not available', () => {
      const headers = getHeaders();
      expect(headers).not.toHaveProperty('Authorization');
      expect(headers).toHaveProperty('Content-Type', 'application/json');
    });
  });

  describe('getAuthHeader', () => {
    it('returns auth header when token exists', () => {
      const mockToken = 'test-token';
      localStorage.setItem('authToken', mockToken);
      const header = getAuthHeader();
      expect(header).toHaveProperty('Authorization', `Bearer ${mockToken}`);
    });

    it('returns empty object when no token exists', () => {
      const header = getAuthHeader();
      expect(header).toEqual({});
    });
  });

  describe('getCSRFToken', () => {
    it('returns CSRF token from cookies', () => {
      document.cookie = 'XSRF-TOKEN=test-csrf-token';
      const token = getCSRFToken();
      expect(token).toBe('test-csrf-token');
    });

    it('returns empty string when no CSRF token exists', () => {
      document.cookie = '';
      const token = getCSRFToken();
      expect(token).toBe('');
    });
  });

  describe('verifyToken', () => {
    it('returns valid response when token is valid', async () => {
      const mockResponse = {
        data: { valid: true },
      };
      (api.get as any).mockResolvedValue(mockResponse);

      const result = await verifyToken();
      expect(result).toEqual(mockResponse.data);
      expect(api.get).toHaveBeenCalledWith('/auth/verify');
    });

    it('returns invalid response when token is invalid', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid token' },
        },
      };
      (api.get as any).mockRejectedValue(mockError);

      const result = await verifyToken();
      expect(result).toEqual({ valid: false });
    });
  });

  describe('checkBackendHealth', () => {
    it('returns healthy status when backend is up', async () => {
      const mockResponse = {
        data: { status: 'ok' },
      };
      (api.get as any).mockResolvedValue(mockResponse);

      const result = await checkBackendHealth();
      expect(result).toBe(true);
      expect(api.get).toHaveBeenCalledWith('/health');
    });

    it('returns unhealthy status when backend is down', async () => {
      const mockError = new Error('Connection refused');
      (api.get as any).mockRejectedValue(mockError);

      const result = await checkBackendHealth();
      expect(result).toBe(false);
    });
  });

  describe('API Interceptors', () => {
    it('adds auth header to requests when token exists', () => {
      const mockToken = 'test-token';
      localStorage.setItem('authToken', mockToken);
      (authService.getAuthHeader as any).mockReturnValue({ Authorization: `Bearer ${mockToken}` });

      const config = { headers: {} };
      const interceptor = api.interceptors.request.use.mock.calls[0][0];
      const result = interceptor(config);

      expect(result.headers).toHaveProperty('Authorization', `Bearer ${mockToken}`);
    });

    it('handles 401 unauthorized responses', () => {
      const mockError = {
        response: {
          status: 401,
        },
      };

      const interceptor = api.interceptors.response.use.mock.calls[0][1];
      interceptor(mockError);

      expect(authService.logout).toHaveBeenCalled();
    });

    it('handles network errors', () => {
      const mockError = {
        code: 'ERR_NETWORK',
        message: 'Network Error',
      };

      const interceptor = api.interceptors.response.use.mock.calls[0][1];
      interceptor(mockError);

      expect(authService.logout).toHaveBeenCalled();
    });
  });
}); 