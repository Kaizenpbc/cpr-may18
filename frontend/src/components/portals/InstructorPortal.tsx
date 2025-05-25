import React, { Suspense, lazy } from 'react';
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

// Lazy load components for better performance (using existing JSX files)
const MyClassesView = lazy(() => import('../views/instructor/MyClassesView.jsx'));
const AttendanceView = lazy(() => import('../views/instructor/AttendanceView.jsx'));
const InstructorArchiveTable = lazy(() => import('../tables/InstructorArchiveTable.jsx'));

// Loading component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <CircularProgress />
  </Box>
);

// Temporary Dashboard component
const InstructorDashboard: React.FC<any> = ({ scheduledClasses, availableDates }) => (
  <Container maxWidth="lg">
    <Typography variant="h4" gutterBottom>Instructor Dashboard</Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6">Scheduled Classes</Typography>
            <Typography variant="h3">{scheduledClasses.length}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6">Available Days</Typography>
            <Typography variant="h3">{availableDates.size}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Container>
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
  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

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
    <InstructorLayout currentView={getCurrentView()} onRefresh={loadData}>
      <Container maxWidth="lg">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/instructor/dashboard" replace />} />
            <Route 
              path="/dashboard" 
              element={
                <InstructorDashboard
                  scheduledClasses={scheduledClasses}
                  availableDates={availableDates}
                />
              } 
            />
            <Route 
              path="/availability" 
              element={
                <AvailabilityView
                  availableDates={Array.from(availableDates)}
                  scheduledClasses={scheduledClasses}
                  onAddAvailability={addAvailability}
                  onRemoveAvailability={removeAvailability}
                  onRefresh={loadData}
                />
              } 
            />
            <Route 
              path="/classes" 
              element={
                <MyClassesView
                  combinedItems={scheduledClasses.map(sc => ({
                    ...sc,
                    type: 'class',
                    key: `class-${sc.course_id}`,
                    displayDate: sc.datescheduled
                  }))}
                  onAttendanceClick={(classId: number) => {
                    // Navigate to attendance view with selected class
                    navigate(`/instructor/attendance`);
                  }}
                  onMarkCompleteClick={async (classItem: any) => {
                    const result = await completeClass(classItem.course_id);
                    if (result.success) {
                      loadData();
                    }
                  }}
                />
              } 
            />
            <Route 
              path="/attendance" 
              element={
                <AttendanceView
                  onAttendanceUpdate={loadData}
                />
              } 
            />
            <Route 
              path="/archive" 
              element={
                <InstructorArchiveTable 
                  courses={completedClasses} 
                />
              } 
            />
          </Routes>
        </Suspense>
      </Container>
    </InstructorLayout>
  );
};

export default InstructorPortal; 