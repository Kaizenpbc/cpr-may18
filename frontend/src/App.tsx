import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RoleBasedRouter from './components/RoleBasedRouter';
import InstructorPortal from './components/portals/InstructorPortal';
import OrganizationPortal from './components/portals/OrganizationPortal';
import CourseAdminPortal from './components/portals/CourseAdminPortal';
import SuperAdminPortal from './components/portals/SuperAdminPortal';
import AccountingPortal from './components/portals/AccountingPortal';
import SystemAdminPortal from './components/portals/SystemAdminPortal';
import { ErrorBoundary } from './components/ErrorBoundary';
import ToastContainer from './components/common/ToastContainer';

console.log('[TRACE] App.tsx - Starting to load dependencies');

function App() {
  console.log('[TRACE] App.tsx - Rendering App component');

  useEffect(() => {
    console.log('[TRACE] App.tsx - App component mounted');
    return () => {
      console.log('[TRACE] App.tsx - App component unmounting');
    };
  }, []);

  try {
    console.log('[TRACE] App.tsx - Starting to render providers and router');
    return (
      <ErrorBoundary>
        <ToastContainer />
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Role-specific portal routes - these allow direct URL access and refresh */}
            <Route path="/instructor/*" element={
              <PrivateRoute requiredRole="instructor">
                <InstructorPortal />
              </PrivateRoute>
            } />
            
            <Route path="/organization/*" element={
              <PrivateRoute requiredRole="organization">
                <OrganizationPortal />
              </PrivateRoute>
            } />
            
            <Route path="/admin/*" element={
              <PrivateRoute requiredRole="admin">
                <CourseAdminPortal />
              </PrivateRoute>
            } />
            
            <Route path="/accounting/*" element={
              <PrivateRoute requiredRole="accountant">
                <AccountingPortal />
              </PrivateRoute>
            } />
            
            <Route path="/superadmin/*" element={
              <PrivateRoute requiredRole="superadmin">
                <SuperAdminPortal />
              </PrivateRoute>
            } />

            <Route path="/sysadmin/*" element={
              <PrivateRoute requiredRole="sysadmin">
                <SystemAdminPortal />
              </PrivateRoute>
            } />

            {/* Main protected route - redirects to role-based portal */}
            <Route path="/" element={
              <PrivateRoute>
                <RoleBasedRouter />
              </PrivateRoute>
            } />

            {/* Legacy routes for backward compatibility */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <RoleBasedRouter />
              </PrivateRoute>
            } />
            
            {/* Fallback for unknown routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
    );
  } catch (error) {
    console.error('[TRACE] App.tsx - Error during render:', error);
    throw error;
  }
}

console.log('[TRACE] App.tsx - Exporting App component');
export default App;