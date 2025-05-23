import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';
import InstructorPortal from './portals/InstructorPortal';
import OrganizationPortal from './portals/OrganizationPortal';
import CourseAdminPortal from './portals/CourseAdminPortal';
import SuperAdminPortal from './portals/SuperAdminPortal';

const RoleBasedRouter: React.FC = () => {
  const { user, loading } = useAuth();

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

  // Route users to appropriate portal based on their role
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