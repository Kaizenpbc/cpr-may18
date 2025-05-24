import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Divider
} from '@mui/material';
import { Person as PersonIcon, Email as EmailIcon } from '@mui/icons-material';
import { organizationApi } from '../../services/api';
import logger from '../../utils/logger';

const ViewStudentsDialog = ({ open, onClose, courseId }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && courseId) {
            const fetchStudents = async () => {
                setLoading(true);
                setError('');
                try {
                    logger.info(`Fetching students for course: ${courseId}`);
                    const response = await organizationApi.getCourseStudents(courseId);
                    const studentsData = response.data?.data || response.data || [];
                    logger.info(`Successfully fetched ${studentsData.length} students for course: ${courseId}`);
                    setStudents(studentsData);
                } catch (err) {
                    logger.error('Failed to fetch students:', err);
                    setError(err.message || 'Failed to fetch students');
                } finally {
                    setLoading(false);
                }
            };
            fetchStudents();
        }
    }, [open, courseId]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            return dateString;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6">Course Student List</Typography>
                    {students.length > 0 && (
                        <Chip 
                            label={`${students.length} Students`} 
                            color="primary" 
                            size="small" 
                        />
                    )}
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ ml: 2 }}>
                            Loading student list...
                        </Typography>
                    </Box>
                )}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {!loading && !error && students.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No students enrolled
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Upload a student list using the "Upload Student List" button in the course table.
                        </Typography>
                    </Box>
                )}
                {!loading && !error && students.length > 0 && (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Total students: {students.length}
                        </Typography>
                        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {students.map((student, index) => (
                                <React.Fragment key={student.id || index}>
                                    <ListItem>
                                        <ListItemIcon>
                                            <PersonIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body1" fontWeight="medium">
                                                    {student.first_name} {student.last_name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box sx={{ mt: 0.5 }}>
                                                    {student.email && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                            <EmailIcon fontSize="small" color="action" />
                                                            <Typography variant="body2" color="text.secondary">
                                                                {student.email}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {student.created_at && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Added: {formatDate(student.created_at)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < students.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewStudentsDialog; 