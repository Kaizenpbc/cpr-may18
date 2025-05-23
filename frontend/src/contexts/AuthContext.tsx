import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  const checkAuth = async () => {
    try {
      // Check if we have a token
      const token = tokenService.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await authService.checkAuth();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        
        // TODO: Initialize socket when backend socket.io server is implemented
        // if (!socket) {
        //   const socketInstance = socketService.initializeSocket(token);
        //   setSocket(socketInstance);
        // }
      } else {
        tokenService.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
        // socketService.disconnectSocket(); // Disabled until socket server implemented
        setSocket(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      tokenService.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      // socketService.disconnectSocket(); // Disabled until socket server implemented
      setSocket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const { user: userData, accessToken } = await authService.login(username, password);
      
      if (accessToken) {
        tokenService.setAccessToken(accessToken);
        
        // TODO: Initialize socket when backend socket.io server is implemented
        // const socketInstance = socketService.initializeSocket(accessToken);
        // setSocket(socketInstance);
        console.log('Socket initialization disabled - backend socket.io server not yet implemented');
      }
      
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      tokenService.clearTokens();
      // socketService.disconnectSocket(); // Disabled until socket server implemented
      setUser(null);
      setIsAuthenticated(false);
      setSocket(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state even if logout API call fails
      tokenService.clearTokens();
      // socketService.disconnectSocket(); // Disabled until socket server implemented
      setUser(null);
      setIsAuthenticated(false);
      setSocket(null);
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