import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { formatDate } from '../../utils/formatters';

const InstructorArchiveTable = ({ courses = [] }) => {
    if (!courses || courses.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Archived Classes
                </Typography>
                <Typography>No archived classes found.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Archived Classes
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date Scheduled</TableCell>
                            <TableCell>Course Number</TableCell>
                            <TableCell>Course Type</TableCell>
                            <TableCell>Organization</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Students Registered</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {courses.map((course) => (
                            <TableRow key={course.courseid}>
                                <TableCell>
                                    {formatDate(course.datescheduled)}
                                </TableCell>
                                <TableCell>{course.coursenumber}</TableCell>
                                <TableCell>{course.coursetypename}</TableCell>
                                <TableCell>{course.organizationname}</TableCell>
                                <TableCell>{course.location}</TableCell>
                                <TableCell>{course.studentsregistered || 0}</TableCell>
                                <TableCell>{course.status}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default InstructorArchiveTable; 