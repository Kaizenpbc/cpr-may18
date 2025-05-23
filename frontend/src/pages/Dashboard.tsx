import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Button,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Class as ClassIcon,
  AssignmentTurnedIn as AttendanceIcon,
} from '@mui/icons-material';
import type { Class, Availability, ApiResponse } from '../types/api';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardData, fetchInstructorAvailability, fetchSchedule } from '../services/api';

console.log('[Debug] Dashboard.tsx - Component loading');

interface DashboardMetrics {
  upcomingClasses: number;
  totalStudents: number;
  completedClasses: number;
  nextClass?: {
    date: string;
    time: string;
    location: string;
    type: string;
  };
  recentClasses: Array<{
    id: string;
    date: string;
    type: string;
    students: number;
  }>;
}

const MetricCard: React.FC<{ title: string; value: number | string; isLoading: boolean }> = ({ title, value, isLoading }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          {title}
        </Typography>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={60}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Typography variant="h4" component="div" sx={{ color: theme.palette.primary.main }}>
            {value}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  console.log('[Debug] Dashboard - Rendering component');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const { data: availability, isLoading: availabilityLoading, error: availabilityError } = useQuery({
    queryKey: ['availability'],
    queryFn: async () => {
      try {
        const response = await fetchInstructorAvailability();
        return response;
      } catch (error) {
        if (error.response?.status === 401) {
          await logout();
          navigate('/login');
        }
        throw error;
      }
    }
  });

  const { data: classes, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      try {
        const response = await fetchSchedule();
        return response;
      } catch (error) {
        if (error.response?.status === 401) {
          await logout();
          navigate('/login');
        }
        throw error;
      }
    }
  });

  const { data, isLoading: dashboardLoading, error: dashboardError } = useQuery<DashboardMetrics>({
    queryKey: ['dashboardData'],
    queryFn: () => fetchDashboardData(),
  });

  console.log('[Debug] Dashboard - Data fetched:', { data, isLoading: dashboardLoading, error: dashboardError });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (availabilityLoading || classesLoading || dashboardLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (availabilityError || classesError || dashboardError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {availabilityError?.message || classesError?.message || dashboardError?.message || 'An error occurred while loading the dashboard'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.full_name}
      </Typography>

      <Grid container spacing={3}>
        {/* Metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Upcoming Classes"
            value={data?.upcomingClasses || 0}
            isLoading={dashboardLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total Students"
            value={data?.totalStudents || 0}
            isLoading={dashboardLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Completed Classes"
            value={data?.completedClasses || 0}
            isLoading={dashboardLoading}
          />
        </Grid>

        {/* Next Class */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Next Class
            </Typography>
            {dashboardLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : data?.nextClass ? (
              <Box>
                <Typography variant="h5" color="primary" gutterBottom>
                  {data.nextClass.type}
                </Typography>
                <Typography>
                  {data.nextClass.date} at {data.nextClass.time}
                </Typography>
                <Typography color="textSecondary">
                  {data.nextClass.location}
                </Typography>
              </Box>
            ) : (
              <Typography color="textSecondary">
                No upcoming classes scheduled
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Classes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Classes
            </Typography>
            {dashboardLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {data?.recentClasses?.map((classItem, index) => (
                  <React.Fragment key={classItem.id}>
                    <ListItem>
                      <ListItemText
                        primary={classItem.type}
                        secondary={`${classItem.date} • ${classItem.students} students`}
                      />
                    </ListItem>
                    {index < (data.recentClasses.length - 1) && <Divider />}
                  </React.Fragment>
                ))}
                {(!data?.recentClasses || data.recentClasses.length === 0) && (
                  <Typography color="textSecondary" sx={{ p: 2 }}>
                    No recent classes
                  </Typography>
                )}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

console.log('[Debug] Dashboard.tsx - Exporting component');
export default Dashboard; 