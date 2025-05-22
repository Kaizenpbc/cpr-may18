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
    Tooltip
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import logger from '../../utils/logger';

const OrganizationCoursesTable = ({ courses, onViewStudents }) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Course Name</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {courses.map((course) => (
                        <TableRow key={course.id}>
                            <TableCell>{course.name}</TableCell>
                            <TableCell>{course.date}</TableCell>
                            <TableCell>{course.time}</TableCell>
                            <TableCell>{course.location}</TableCell>
                            <TableCell>
                                <Tooltip title="View Students">
                                    <IconButton onClick={() => onViewStudents(course.id)}>
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