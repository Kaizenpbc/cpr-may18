import authService from '../authService';
import axios from 'axios';

vi.mock('axios');

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('successfully logs in user and stores token', async () => {
      const mockUser = { id: 1, username: 'testuser', token: 'test-token' };
      axios.post.mockResolvedValue({ data: mockUser });

      const result = await authService.login('testuser', 'password123');

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        { username: 'testuser', password: 'password123' }
      );
      expect(result).toEqual(mockUser);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('handles login error', async () => {
      const errorMessage = 'Invalid credentials';
      axios.post.mockRejectedValue({ response: { data: { message: errorMessage } } });

      await expect(authService.login('wronguser', 'wrongpass')).rejects.toThrow(errorMessage);
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears user data from localStorage', () => {
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }));
      authService.logout();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when no user is stored', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('returns parsed user data when user is stored', () => {
      const mockUser = { id: 1, username: 'testuser' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(authService.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe('getAuthHeader', () => {
    it('returns empty object when no user is stored', () => {
      expect(authService.getAuthHeader()).toEqual({});
    });

    it('returns auth header when user is stored', () => {
      const mockUser = { id: 1, username: 'testuser', token: 'test-token' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(authService.getAuthHeader()).toEqual({ Authorization: 'Bearer test-token' });
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no user is stored', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('returns false when user has no token', () => {
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }));
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('returns true when user has token', () => {
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser', token: 'test-token' }));
      expect(authService.isAuthenticated()).toBe(true);
    });
  });
}); 