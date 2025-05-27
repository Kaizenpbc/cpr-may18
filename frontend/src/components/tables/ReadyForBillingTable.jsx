import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Box,
    Typography,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import { Receipt as InvoiceIcon } from '@mui/icons-material';
import { formatDate, formatCurrency } from '../../utils/formatters';

const ReadyForBillingTable = ({ courses, onCreateInvoice, isLoading, error }) => {
    const [creatingInvoice, setCreatingInvoice] = useState({});

    const handleCreateInvoice = async (courseId) => {
        setCreatingInvoice(prev => ({ ...prev, [courseId]: true }));
        try {
            await onCreateInvoice(courseId);
        } finally {
            setCreatingInvoice(prev => ({ ...prev, [courseId]: false }));
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!courses || courses.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="textSecondary">
                    No courses ready for billing at this time.
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Completed courses marked as "Ready for Billing" by Course Admin will appear here.
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Date Completed</TableCell>
                        <TableCell>Organization</TableCell>
                        <TableCell>Course Type</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Instructor</TableCell>
                        <TableCell align="center">Students Attended</TableCell>
                        <TableCell align="right">Rate/Student</TableCell>
                        <TableCell align="right">Total Amount</TableCell>
                        <TableCell align="center">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {courses.map((course) => (
                        <TableRow key={course.course_id}>
                            <TableCell>{formatDate(course.date_completed)}</TableCell>
                            <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                    {course.organization_name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {course.contact_email}
                                </Typography>
                            </TableCell>
                            <TableCell>{course.course_type_name}</TableCell>
                            <TableCell>{course.location}</TableCell>
                            <TableCell>{course.instructor_name}</TableCell>
                            <TableCell align="center">
                                <Chip 
                                    label={course.students_attended} 
                                    size="small" 
                                    color="primary"
                                    variant="outlined"
                                />
                            </TableCell>
                            <TableCell align="right">
                                {formatCurrency(course.rate_per_student)}
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="body2" fontWeight="bold" color="primary">
                                    {formatCurrency(course.total_amount)}
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    startIcon={<InvoiceIcon />}
                                    onClick={() => handleCreateInvoice(course.course_id)}
                                    disabled={creatingInvoice[course.course_id]}
                                >
                                    {creatingInvoice[course.course_id] ? 'Creating...' : 'Create Invoice'}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ReadyForBillingTable; 