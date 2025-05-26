import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useInstructorData } from '../../hooks/useInstructorData';
import InstructorLayout from './InstructorLayout';
import AvailabilityView from '../views/instructor/AvailabilityView';
import ErrorBoundary from '../common/ErrorBoundary';
import ToastDemo from '../common/ToastDemo';
import InstructorProfile from '../views/instructor/InstructorProfile';
import analytics from '../../services/analytics';
import { useToast } from '../../contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

// Lazy load components for better performance (using TypeScript files)
const InstructorDashboard = lazy(() => import('../views/instructor/InstructorDashboard.tsx'));
const MyClassesView = lazy(() => import('../views/instructor/MyClassesView.tsx'));
const AttendanceView = lazy(() => import('../views/instructor/AttendanceView.jsx'));
const InstructorArchiveTable = lazy(() => import('../tables/InstructorArchiveTable.tsx'));

// Loading component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <CircularProgress />
  </Box>
);

const InstructorPortal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { error: toastError } = useToast();
  const queryClient = useQueryClient();
  const {
    availableDates,
    scheduledClasses,
    completedClasses,
    loading,
    error,
    addAvailability,
    removeAvailability,
    fetchClassStudents,
    updateAttendance,
    completeClass,
    loadData
  } = useInstructorData();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // Analytics: Track user and page views
  useEffect(() => {
    if (isAuthenticated && user) {
      analytics.setUser(user.id || user.username, {
        role: user.role,
        portal: 'instructor'
      });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const currentView = getCurrentView();
    analytics.trackPageView(`instructor_${currentView}`, {
      portal: 'instructor',
      view: currentView
    });
  }, [location.pathname]);

  // Error handler for error boundaries
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    analytics.trackError(error, 'instructor_portal', {
      componentStack: errorInfo.componentStack,
      view: getCurrentView()
    });
  };

  // Get current view from URL
  const getCurrentView = () => {
    const pathSegments = location.pathname.split('/');
    return pathSegments[pathSegments.length - 1] || 'dashboard';
  };

  if (loading) {
    return (
      <InstructorLayout currentView={getCurrentView()} onRefresh={loadData}>
        <LoadingFallback />
      </InstructorLayout>
    );
  }

  if (error) {
    return (
      <InstructorLayout currentView={getCurrentView()} onRefresh={loadData}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="h6">{error.userMessage || 'Error Loading Data'}</Typography>
            <Typography>{error.suggestion || error.message || 'An unexpected error occurred'}</Typography>
          </Alert>
        </Container>
      </InstructorLayout>
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      <InstructorLayout currentView={getCurrentView()} onRefresh={loadData}>
        <Container maxWidth="lg">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/instructor/dashboard" replace />} />
              <Route 
                path="/dashboard" 
                element={
                  <ErrorBoundary onError={handleError}>
                    <InstructorDashboard
                      scheduledClasses={scheduledClasses}
                      availableDates={availableDates}
                    />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/availability" 
                element={
                  <ErrorBoundary onError={handleError}>
                    <AvailabilityView
                      availableDates={Array.from(availableDates)}
                      scheduledClasses={scheduledClasses}
                      onAddAvailability={async (date) => {
                        analytics.trackAvailabilityAction('add', date);
                        return await addAvailability(date);
                      }}
                      onRemoveAvailability={async (date) => {
                        analytics.trackAvailabilityAction('remove', date);
                        return await removeAvailability(date);
                      }}
                      onRefresh={loadData}
                    />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/classes" 
                element={
                  <ErrorBoundary onError={handleError}>
                    <Box>
                      {/* Debug section - remove this after fixing the issue */}
                      <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>Debug Tools</Typography>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => {
                            queryClient.resetQueries();
                            queryClient.clear();
                            loadData();
                            toastError('Cache cleared - refreshing data...');
                          }}
                        >
                          Clear All Cache & Refresh
                        </Button>
                      </Box>
                      
                      <MyClassesView
                        combinedItems={(() => {
                          // Get dates that already have scheduled classes
                          const scheduledDates = new Set(scheduledClasses.map((sc: any) => sc.datescheduled));
                          
                          // Debug log to see what's in availableDates
                          console.log('[InstructorPortal] Available dates:', Array.from(availableDates));
                          console.log('[InstructorPortal] Scheduled dates:', Array.from(scheduledDates));
                          
                          return [
                            // Add scheduled classes (backend now excludes completed ones)
                            ...scheduledClasses.map((sc: any) => ({
                              ...sc,
                              type: 'class' as const,
                              key: `class-${sc.course_id}`,
                              displayDate: sc.datescheduled,
                              organizationname: sc.organizationname,
                              location: sc.location,
                              coursenumber: sc.course_id.toString(),
                              coursetypename: sc.coursetypename,
                              studentsregistered: sc.studentcount,
                              studentsattendance: sc.studentsattendance,
                              notes: '',
                              status: 'Scheduled'
                            })),
                            // Add availability dates ONLY if they don't conflict with scheduled classes
                            ...Array.from(availableDates)
                              .filter(date => !scheduledDates.has(date))
                              .map(date => ({
                                type: 'availability' as const,
                                key: `availability-${date}`,
                                displayDate: date,
                                organizationname: '',
                                location: '',
                                coursenumber: '',
                                coursetypename: '',
                                studentsregistered: undefined,
                                studentsattendance: undefined,
                                notes: '',
                                status: 'Available',
                                course_id: undefined
                              }))
                          ].sort((a, b) => new Date(a.displayDate).getTime() - new Date(b.displayDate).getTime());
                        })()}
                        onAttendanceClick={(item) => {
                          analytics.trackClassAction('view_attendance', item.course_id);
                          navigate(`/instructor/attendance`);
                        }}
                        onMarkCompleteClick={async (classItem) => {
                          analytics.trackClassAction('mark_complete', classItem.course_id);
                          try {
                            await completeClass(classItem.course_id || 0);
                            analytics.trackClassAction('completed_successfully', classItem.course_id);
                            loadData();
                          } catch (error: any) {
                            // Display user-friendly error message
                            const errorMessage = error.suggestion || error.userMessage || error.message || 'Failed to complete class. Please try again.';
                            toastError(errorMessage);
                            console.error('Failed to complete class:', error);
                          }
                        }}
                      />
                    </Box>
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/attendance" 
                element={
                  <ErrorBoundary onError={handleError}>
                    <AttendanceView
                      onAttendanceUpdate={(studentId, attendance) => {
                        analytics.trackInstructorAction('update_attendance', { studentId, attendance });
                        return loadData();
                      }}
                    />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/archive" 
                element={
                  <ErrorBoundary onError={handleError}>
                    <InstructorArchiveTable 
                      courses={completedClasses} 
                    />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/toast-demo" 
                element={
                  <ErrorBoundary onError={handleError}>
                    <ToastDemo />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ErrorBoundary onError={handleError}>
                    <InstructorProfile />
                  </ErrorBoundary>
                } 
              />
            </Routes>
          </Suspense>
        </Container>
      </InstructorLayout>
    </ErrorBoundary>
  );
};

export default InstructorPortal; 