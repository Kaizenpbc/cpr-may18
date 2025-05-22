import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from '@mui/material';
import { format } from 'date-fns';

const CourseHistoryView = ({ courseHistory }) => {
    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Course History
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    View your completed courses and their details.
                </Typography>
            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Course Number</TableCell>
                            <TableCell>Course Type</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Students</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {courseHistory.map((course) => (
                            <TableRow key={course.courseid}>
                                <TableCell>{course.coursenumber}</TableCell>
                                <TableCell>{course.coursetypename}</TableCell>
                                <TableCell>
                                    {format(new Date(course.datescheduled), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>{course.location}</TableCell>
                                <TableCell>{course.studentcount}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={course.completed ? 'Completed' : 'Cancelled'}
                                        color={course.completed ? 'success' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {courseHistory.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography color="text.secondary">
                                        No course history found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default CourseHistoryView; 