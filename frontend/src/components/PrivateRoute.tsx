import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tokenService } from '../services/tokenService';
import { CircularProgress, Box } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated and no token exists, redirect to login
  if (!isAuthenticated && !tokenService.getAccessToken()) {
    // Save the current location so we can redirect back after login
    tokenService.saveCurrentLocation(location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have a token but no user yet, continue showing loading
  // This handles the case where authentication is still being verified
  if (tokenService.getAccessToken() && !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // If we don't have a user at this point, something went wrong
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to their appropriate dashboard instead of generic /dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;