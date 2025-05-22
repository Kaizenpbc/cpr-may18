import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MySchedule from './pages/MySchedule';
import Attendance from './pages/Attendance';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import InstructorAvailability from './pages/InstructorAvailability';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

console.log('[TRACE] App.tsx - Starting to load dependencies');

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[TRACE] Error caught in boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="schedule" element={<MySchedule />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="profile" element={<Profile />} />
            <Route path="instructor/availability" element={<InstructorAvailability />} />
            <Route path="*" element={<NotFound />} />
          </Route>
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