import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import api from '../../../api';
import logger from '../../../utils/logger';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ClassesView = ({ classes }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    logger.debug('[ClassesView] Component rendered with classes:', classes);

    const handleUpdateAttendance = async (classId, attendance) => {
        logger.debug('[ClassesView] Updating attendance for class:', classId, attendance);
        setLoading(true);
        setError(null);

        try {
            logger.debug('[ClassesView] Making API request to update attendance...');
            const response = await api.post('/instructor/classes/students/attendance', {
                course_id: classId,
                attendance
            });
            logger.debug('[ClassesView] Update response:', response.data);
        } catch (error) {
            logger.error('[ClassesView] Error updating attendance:', error);
            if (error.response?.status === 401) {
                await logout();
                navigate('/login');
                return;
            }
            setError('Failed to update attendance');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateNotes = async (classId, notes) => {
        logger.debug('[ClassesView] Updating notes for class:', classId, notes);
        setLoading(true);
        setError(null);

        try {
            logger.debug('[ClassesView] Making API request to update notes...');
            const response = await api.post('/instructor/classes/notes', {
                course_id: classId,
                notes
            });
            logger.debug('[ClassesView] Update response:', response.data);
        } catch (error) {
            logger.error('[ClassesView] Error updating notes:', error);
            if (error.response?.status === 401) {
                await logout();
                navigate('/login');
                return;
            }
            setError('Failed to update notes');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                My Classes
            </Typography>
            {/* Add classes table or list here */}
        </Box>
    );
};

export default ClassesView; 