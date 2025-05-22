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
    Button,
    Chip
} from '@mui/material';
import { format } from 'date-fns';

const ScheduledClassesView = ({ scheduledClasses, onAttendanceClick }) => {
    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Scheduled Classes
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    View and manage your upcoming classes.
                </Typography>
            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Course Number</TableCell>
                            <TableCell>Course Type</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Students</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {scheduledClasses.map((course) => (
                            <TableRow key={course.courseid}>
                                <TableCell>{course.coursenumber}</TableCell>
                                <TableCell>{course.coursetypename}</TableCell>
                                <TableCell>
                                    {format(new Date(course.datescheduled), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(course.datescheduled), 'h:mm a')}
                                </TableCell>
                                <TableCell>{course.location}</TableCell>
                                <TableCell>{course.studentcount}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={course.completed ? 'Completed' : 'Scheduled'}
                                        color={course.completed ? 'success' : 'primary'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => onAttendanceClick(course.courseid)}
                                        disabled={course.completed}
                                    >
                                        Take Attendance
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {scheduledClasses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Typography color="text.secondary">
                                        No scheduled classes found
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

export default ScheduledClassesView; 