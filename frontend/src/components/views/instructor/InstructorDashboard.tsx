import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Paper
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Class as ClassIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

interface InstructorDashboardProps {
  scheduledClasses?: any[];
  availableDates?: Set<string>;
  completedClasses?: any[];
}

/**
 * Instructor Dashboard - Overview of instructor activities
 */
const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
  scheduledClasses = [],
  availableDates = new Set(),
  completedClasses = []
}) => {
  
  const upcomingClasses = scheduledClasses.filter(cls => !cls.completed).slice(0, 3);
  const recentCompleted = completedClasses.slice(0, 3);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Instructor Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ClassIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Scheduled Classes</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {scheduledClasses.filter(cls => !cls.completed).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Available Days</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {availableDates.size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Completed Classes</Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                {completedClasses.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Students</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                {scheduledClasses.reduce((total, cls) => total + (cls.studentcount || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Classes */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Classes
            </Typography>
            {upcomingClasses.length > 0 ? (
              upcomingClasses.map((cls, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {cls.coursetypename}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cls.organizationname} - {cls.location}
                    </Typography>
                    <Typography variant="body2">
                      {new Date(cls.datescheduled).toLocaleDateString()}
                    </Typography>
                    <Chip 
                      label={`${cls.studentcount || 0} students`} 
                      size="small" 
                      color="primary" 
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No upcoming classes scheduled
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Completed Classes
            </Typography>
            {recentCompleted.length > 0 ? (
              recentCompleted.map((cls, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {cls.coursetypename}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cls.organizationname} - {cls.location}
                    </Typography>
                    <Typography variant="body2">
                      {new Date(cls.datescheduled).toLocaleDateString()}
                    </Typography>
                    <Chip 
                      label="Completed" 
                      size="small" 
                      color="success" 
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No completed classes yet
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InstructorDashboard; 