import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { api, WS_URL, getHeaders, getAuthHeader, getCSRFToken, verifyToken, checkBackendHealth } from '../config';
import authService from '../../services/authService';

// Mock authService
vi.mock('../../services/authService', () => ({
  default: {
    getAuthHeader: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('API Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = '';
  });

  describe('WS_URL', () => {
    it('has correct default value', () => {
      expect(WS_URL).toBe('ws://localhost:3001');
    });
  });

  describe('getHeaders', () => {
    it('returns headers with auth token when available', () => {
      const mockToken = 'test-token';
      localStorage.getItem.mockReturnValue(mockToken);
      document.cookie = 'XSRF-TOKEN=test-csrf-token';

      const headers = getHeaders();
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'test-csrf-token',
        'Authorization': 'Bearer test-token'
      });
    });

    it('returns headers without auth token when not available', () => {
      localStorage.getItem.mockReturnValue(null);
      document.cookie = 'XSRF-TOKEN=test-csrf-token';

      const headers = getHeaders();
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'test-csrf-token'
      });
    });
  });

  describe('getAuthHeader', () => {
    it('returns auth header when token exists', () => {
      const mockToken = 'test-token';
      localStorage.getItem.mockReturnValue(mockToken);

      const header = getAuthHeader();
      expect(header).toEqual({ Authorization: 'Bearer test-token' });
    });

    it('returns empty object when no token exists', () => {
      localStorage.getItem.mockReturnValue(null);

      const header = getAuthHeader();
      expect(header).toEqual({});
    });
  });

  describe('getCSRFToken', () => {
    it('returns CSRF token from cookies', () => {
      document.cookie = 'XSRF-TOKEN=test-csrf-token';
      expect(getCSRFToken()).toBe('test-csrf-token');
    });

    it('returns empty string when no CSRF token exists', () => {
      expect(getCSRFToken()).toBe('');
    });
  });

  describe('verifyToken', () => {
    it('returns valid response when token is valid', async () => {
      const mockResponse = {
        data: {
          valid: true,
          user: { id: 1, username: 'testuser' }
        }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await verifyToken();
      expect(result).toEqual({
        valid: true,
        user: { id: 1, username: 'testuser' }
      });
    });

    it('returns invalid response when token is invalid', async () => {
      const mockError = {
        response: {
          data: { message: 'Invalid token' }
        }
      };
      api.get.mockRejectedValue(mockError);

      const result = await verifyToken();
      expect(result).toEqual({
        valid: false,
        error: 'Invalid token'
      });
    });
  });

  describe('checkBackendHealth', () => {
    it('returns healthy status when backend is up', async () => {
      const mockResponse = {
        data: { status: 'ok' }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await checkBackendHealth();
      expect(result).toEqual({
        status: 'healthy',
        data: { status: 'ok' }
      });
    });

    it('returns unhealthy status when backend is down', async () => {
      const mockError = new Error('Connection refused');
      api.get.mockRejectedValue(mockError);

      const result = await checkBackendHealth();
      expect(result).toEqual({
        status: 'unhealthy',
        error: 'Connection refused'
      });
    });
  });

  describe('API Interceptors', () => {
    it('adds auth header to requests when token exists', async () => {
      const mockToken = 'test-token';
      localStorage.getItem.mockReturnValue(mockToken);

      const config = {
        headers: {}
      };

      const result = api.interceptors.request.handlers[0].fulfilled(config);
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('handles 401 unauthorized responses', async () => {
      const error = {
        response: {
          status: 401
        }
      };

      await expect(api.interceptors.response.handlers[0].rejected(error))
        .rejects.toEqual(error);
      expect(authService.logout).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('handles network errors', async () => {
      const error = {
        code: 'ERR_NETWORK',
        message: 'Network Error'
      };

      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      await expect(api.interceptors.response.handlers[0].rejected(error))
        .rejects.toEqual(error);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'backend-connection-error'
        })
      );
    });
  });
}); 