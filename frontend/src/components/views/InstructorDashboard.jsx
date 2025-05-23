import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper,
    CircularProgress, Button, Dialog,
    DialogTitle, DialogContent, DialogActions,
    TextField, Alert,
    Grid
} from '@mui/material';
import { formatDate } from '../../utils/formatters';
import logger from '../../utils/logger';

const InstructorDashboard = ({ scheduledClasses = [] }) => {
    if (!scheduledClasses) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const upcomingClasses = scheduledClasses.filter(course => 
        new Date(course.datescheduled) >= new Date()
    ).sort((a, b) => new Date(a.datescheduled) - new Date(b.datescheduled));

    const nextClass = upcomingClasses[0];
    const totalUpcoming = upcomingClasses.length;

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Instructor Dashboard
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Next Class
                        </Typography>
                        {nextClass ? (
                            <>
                                <Typography variant="body1">
                                    Course: {nextClass.coursenumber}
                                </Typography>
                                <Typography variant="body1">
                                    Date: {formatDate(nextClass.datescheduled)}
                                </Typography>
                                <Typography variant="body1">
                                    Location: {nextClass.location}
                                </Typography>
                                <Typography variant="body1">
                                    Students: {nextClass.studentsregistered || 0}
                                </Typography>
                                <Typography variant="body1">
                                    Organization: {nextClass.organizationname}
                                </Typography>
                                <Typography variant="body1">
                                    Course Type: {nextClass.coursetypename}
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="body1">
                                No upcoming classes scheduled
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Upcoming Classes
                        </Typography>
                        <Typography variant="h4">
                            {totalUpcoming}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total classes scheduled
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default InstructorDashboard; 