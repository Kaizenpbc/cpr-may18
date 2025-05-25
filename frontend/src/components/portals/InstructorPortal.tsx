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
  CardContent
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useInstructorData } from '../../hooks/useInstructorData';
import InstructorLayout from './InstructorLayout';
import AvailabilityView from '../views/instructor/AvailabilityView';
import ErrorBoundary from '../common/ErrorBoundary';
import ToastDemo from '../common/ToastDemo';
import analytics from '../../services/analytics';

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
            <Typography variant="h6">Error Loading Data</Typography>
            <Typography>{error}</Typography>
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
                    <MyClassesView
                      combinedItems={(() => {
                        // Get dates that already have scheduled classes
                        const scheduledDates = new Set(scheduledClasses.map(sc => sc.datescheduled));
                        
                        return [
                          // Add scheduled classes
                          ...scheduledClasses.map(sc => ({
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
                            status: sc.completed ? 'Completed' : 'Scheduled'
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
                        const result = await completeClass(classItem.course_id || 0);
                        if (result.success) {
                          analytics.trackClassAction('completed_successfully', classItem.course_id);
                          loadData();
                        }
                      }}
                    />
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
                      courses={completedClasses.map(cc => ({
                        id: cc.course_id,
                        course_id: cc.course_id,
                        course_type: cc.coursetypename,
                        course_type_id: 0,
                        organization_id: 0,
                        organization_name: cc.organizationname,
                        location_id: 0,
                        location_name: cc.location,
                        address: '',
                        start_date: cc.datescheduled,
                        end_date: cc.datescheduled,
                        start_time: '',
                        end_time: '',
                        max_students: cc.studentcount,
                        current_students: cc.studentsattendance,
                        price: 0,
                        status: 'completed' as const,
                        instructor_id: 0,
                        instructor_name: '',
                        created_at: '',
                        updated_at: cc.datescheduled
                      }))} 
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
            </Routes>
          </Suspense>
        </Container>
      </InstructorLayout>
    </ErrorBoundary>
  );
};

export default InstructorPortal; 