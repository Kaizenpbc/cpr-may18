import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';
import InstructorPortal from './portals/InstructorPortal';
import OrganizationPortal from './portals/OrganizationPortal';
import CourseAdminPortal from './portals/CourseAdminPortal';
import SuperAdminPortal from './portals/SuperAdminPortal';

const RoleBasedRouter: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect users to their role-specific URLs for better bookmarking and refresh behavior
    if (user && !loading) {
      const roleRoutes = {
        instructor: '/instructor',
        organization: '/organization', 
        admin: '/admin',
        superadmin: '/superadmin'
      };

      const targetRoute = roleRoutes[user.role as keyof typeof roleRoutes];
      if (targetRoute) {
        console.log(`[Debug] RoleBasedRouter - Redirecting ${user.role} to ${targetRoute}`);
        navigate(targetRoute, { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography variant="h6">Please log in to access the portal</Typography>
      </Box>
    );
  }

  // For direct access (when not redirecting), still render the appropriate portal
  // This ensures the component works even if the redirect hasn't happened yet
  switch (user.role) {
    case 'instructor':
      return <InstructorPortal />;
    case 'organization':
      return <OrganizationPortal />;
    case 'admin':
      return <CourseAdminPortal />;
    case 'superadmin':
      return <SuperAdminPortal />;
    default:
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography variant="h6" color="error">
            Invalid user role: {user.role}. Please contact support.
          </Typography>
        </Box>
      );
  }
};

export default RoleBasedRouter; 