import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Chip,
    Typography,
    Box
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import logger from '../../utils/logger';

const getStatusChipColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'confirmed':
            return 'success';
        case 'pending':
            return 'warning';
        case 'cancelled':
            return 'error';
        default:
            return 'default';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (error) {
        logger.error('Error formatting date:', error);
        return dateString;
    }
};

const formatTime = (timeString) => {
    if (!timeString) return '-';
    try {
        return timeString.slice(0, 5); // HH:MM format
    } catch (error) {
        logger.error('Error formatting time:', error);
        return timeString;
    }
};

const OrganizationCoursesTable = ({ courses, onViewStudents }) => {
    logger.info('OrganizationCoursesTable rendering with courses:', courses);

    if (!courses || courses.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                    No courses found
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Start by requesting a new course using the "Schedule Course" option.
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Date Requested</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Course Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Students</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Instructor</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Scheduled Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Scheduled Time</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {courses.map((course) => (
                        <TableRow key={course.id} hover>
                            <TableCell>{formatDate(course.date_requested)}</TableCell>
                            <TableCell>{course.course_type || '-'}</TableCell>
                            <TableCell>{course.location || '-'}</TableCell>
                            <TableCell align="center">{course.registered_students || 0}</TableCell>
                            <TableCell>
                                <Chip 
                                    label={course.status || 'Unknown'} 
                                    color={getStatusChipColor(course.status)} 
                                    size="small"
                                />
                            </TableCell>
                            <TableCell>
                                {course.instructor_name ? (
                                    <Typography variant="body2" color="primary">
                                        {course.instructor_name}
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        Not assigned
                                    </Typography>
                                )}
                            </TableCell>
                            <TableCell>
                                {course.scheduled_date ? formatDate(course.scheduled_date) : '-'}
                            </TableCell>
                            <TableCell>
                                {course.scheduled_start_time ? formatTime(course.scheduled_start_time) : '-'}
                            </TableCell>
                            <TableCell>
                                {course.notes ? (
                                    <Tooltip title={course.notes}>
                                        <Typography variant="body2" sx={{ 
                                            maxWidth: 100, 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {course.notes}
                                        </Typography>
                                    </Tooltip>
                                ) : '-'}
                            </TableCell>
                            <TableCell>
                                <Tooltip title="View Course Details">
                                    <IconButton 
                                        onClick={() => onViewStudents && onViewStudents(course.id)}
                                        size="small"
                                        color="primary"
                                    >
                                        <ViewIcon />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default OrganizationCoursesTable; 