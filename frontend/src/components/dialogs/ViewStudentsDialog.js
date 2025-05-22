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
    ListItemText
} from '@mui/material';
import { getCourseStudents } from '../../services/studentService';
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
                    const data = await getCourseStudents(courseId);
                    logger.info(`Successfully fetched ${data.length} students for course: ${courseId}`);
                    setStudents(data);
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

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Course Students</DialogTitle>
            <DialogContent dividers>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                )}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {!loading && !error && students.length === 0 && (
                    <Typography variant="body1" align="center">
                        No students enrolled in this course
                    </Typography>
                )}
                {!loading && !error && students.length > 0 && (
                    <List>
                        {students.map((student) => (
                            <ListItem key={student.id}>
                                <ListItemText
                                    primary={`${student.firstName} ${student.lastName}`}
                                    secondary={student.email || 'No email provided'}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewStudentsDialog; 