import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User } from '../types/api';
import { authService } from '../services/authService';
import { tokenService } from '../services/tokenService';
import socketService from '../services/socketService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  setUser: (user: User | null) => void;
  socket: any; // Socket.IO socket instance
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Start with false instead of true
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Failsafe: Never let loading state last more than 10 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('[Debug] AuthContext - Forcing loading to false after timeout');
        setLoading(false);
        setIsChecking(false);
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [loading]);

  const checkAuth = async () => {
    // Prevent multiple concurrent auth checks
    if (isChecking) {
      console.log('[Debug] AuthContext - Auth check already in progress, skipping');
      return;
    }

    try {
      setIsChecking(true);
      
      // Save current location (except for auth pages)
      if (typeof tokenService.saveCurrentLocation === 'function') {
        tokenService.saveCurrentLocation(location.pathname);
      }
      
      // Check if we have a token
      const token = tokenService.getAccessToken();
      if (!token) {
        console.log('[Debug] AuthContext - No token found, user not authenticated');
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        setIsChecking(false);
        return;
      }

      console.log('[Debug] AuthContext - Token found, checking authentication');
      const userData = await authService.checkAuth();
      if (userData) {
        console.log('[Debug] AuthContext - Authentication successful, user:', userData.username);
        setUser(userData);
        setIsAuthenticated(true);
        
        // TODO: Initialize socket when backend socket.io server is implemented
        // if (!socket) {
        //   const socketInstance = socketService.initializeSocket(token);
        //   setSocket(socketInstance);
        // }
      } else {
        console.log('[Debug] AuthContext - Authentication failed, clearing tokens');
        tokenService.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
        // socketService.disconnectSocket(); // Disabled until socket server implemented
        setSocket(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // Only clear tokens and state, don't force navigation
      tokenService.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      // socketService.disconnectSocket(); // Disabled until socket server implemented
      setSocket(null);
    } finally {
      setLoading(false);
      setIsChecking(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const performAuthCheck = async () => {
      if (isMounted && !isChecking) {
        // Only check auth if we have a token
        const token = tokenService.getAccessToken();
        if (token) {
          setLoading(true);
          await checkAuth();
        } else {
          console.log('[Debug] AuthContext - No token on mount, staying logged out');
          setLoading(false);
        }
      }
    };
    
    performAuthCheck();
    
    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  const login = async (username: string, password: string) => {
    try {
      const { user: userData, accessToken, refreshToken } = await authService.login(username, password);
      
      if (accessToken) {
        // Ensure token is stored
        tokenService.setAccessToken(accessToken);
        
        // Also store refresh token if provided
        if (refreshToken) {
          tokenService.setRefreshToken(refreshToken);
        }
        
        // Verify token is actually stored
        const storedToken = tokenService.getAccessToken();
        console.log('[Debug] AuthContext - Token stored successfully:', !!storedToken);
        
        // Set state after token is confirmed
        setUser(userData);
        setIsAuthenticated(true);
        
        // Check for saved location and redirect appropriately
        const savedLocation = typeof tokenService.getSavedLocation === 'function' 
          ? tokenService.getSavedLocation() 
          : null;
        if (savedLocation && savedLocation !== '/login') {
          console.log('[Debug] AuthContext - Redirecting to saved location:', savedLocation);
          if (typeof tokenService.clearSavedLocation === 'function') {
            tokenService.clearSavedLocation();
          }
          navigate(savedLocation, { replace: true });
        } else {
          // Navigate to role-appropriate dashboard
          console.log('[Debug] AuthContext - Navigating to role-based dashboard');
          navigate('/', { replace: true });
        }
        
        // TODO: Initialize socket when backend socket.io server is implemented
        // const socketInstance = socketService.initializeSocket(accessToken);
        // setSocket(socketInstance);
        console.log('Socket initialization disabled - backend socket.io server not yet implemented');
      } else {
        throw new Error('No access token received from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Save current location before logout (optional - for "return to page after login")
      if (typeof tokenService.saveCurrentLocation === 'function') {
        tokenService.saveCurrentLocation(location.pathname);
      }
      
      await authService.logout();
      tokenService.clearTokens();
      // socketService.disconnectSocket(); // Disabled until socket server implemented
      setUser(null);
      setIsAuthenticated(false);
      setSocket(null);
      
      // Navigate to login page
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state even if logout API call fails
      tokenService.clearTokens();
      // socketService.disconnectSocket(); // Disabled until socket server implemented
      setUser(null);
      setIsAuthenticated(false);
      setSocket(null);
      
      // Navigate to login page even on error
      navigate('/login', { replace: true });
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    login,
    logout,
    loading,
    socket: socket || { on: () => {}, off: () => {}, emit: () => {} } // Provide safe fallback
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};