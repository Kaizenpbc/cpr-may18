import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RoleBasedRouter from './components/RoleBasedRouter';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

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
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
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
      </AuthProvider>
    );
  } catch (error) {
    console.error('[TRACE] App.tsx - Error during render:', error);
    throw error;
  }
}

console.log('[TRACE] App.tsx - Exporting App component');
export default App;