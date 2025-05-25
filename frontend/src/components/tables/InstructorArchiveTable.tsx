import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Typography, Chip,
    Box, Tooltip
} from '@mui/material';
import {
    CheckCircle as CompletedIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { Course } from '../../types/instructor';

interface InstructorArchiveTableProps {
    courses: Course[];
}

/**
 * Commercial-grade instructor archive table for displaying completed courses
 */
const InstructorArchiveTable: React.FC<InstructorArchiveTableProps> = ({ courses = [] }) => {
    
    const formatDate = (dateString?: string): string => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    const formatTime = (timeString?: string): string => {
        if (!timeString) return '';
        return timeString.slice(0, 5); // Convert "09:00:00" to "09:00"
    };

    return (
        <Paper elevation={2}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CompletedIcon color="success" />
                    Completed Classes Archive
                    <Chip 
                        label={`${courses.length} course${courses.length !== 1 ? 's' : ''}`} 
                        size="small" 
                        color="success" 
                        variant="outlined"
                    />
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    View your teaching history and completed course details
                </Typography>
            </Box>
            
            {courses.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <CompletedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No Completed Classes Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Completed classes will appear here after you mark them as finished.
                    </Typography>
                </Box>
            ) : (
                <TableContainer>
                    <Table stickyHeader size="medium">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                    Class Date
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                    Course Type
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                    Organization
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                    Location
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="center">
                                    Time
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="center">
                                    Students
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                    Completed On
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="center">
                                    Status
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {courses.map((course, index) => {
                                const rowColor = index % 2 === 0 ? '#ffffff' : '#fafafa';
                                
                                return (
                                    <TableRow 
                                        key={course.course_id || index}
                                        sx={{ 
                                            '&:hover': {
                                                backgroundColor: '#f0f7ff'
                                            }
                                        }}
                                    >
                                        <TableCell sx={{ backgroundColor: rowColor }}>
                                            <Typography variant="body2" fontWeight="medium">
                                                {formatDate(course.start_date)}
                                            </Typography>
                                        </TableCell>
                                        
                                        <TableCell sx={{ backgroundColor: rowColor }}>
                                            <Typography variant="body2">
                                                {course.course_type || 'CPR Class'}
                                            </Typography>
                                        </TableCell>
                                        
                                        <TableCell sx={{ backgroundColor: rowColor }}>
                                            <Typography variant="body2">
                                                {course.organization_name || 'Unassigned'}
                                            </Typography>
                                        </TableCell>
                                        
                                        <TableCell sx={{ backgroundColor: rowColor }}>
                                            <Typography variant="body2">
                                                {course.location_name || 'TBD'}
                                            </Typography>
                                        </TableCell>
                                        
                                        <TableCell align="center" sx={{ backgroundColor: rowColor }}>
                                            <Typography variant="body2">
                                                {formatTime(course.start_time)} - {formatTime(course.end_time)}
                                            </Typography>
                                        </TableCell>
                                        
                                        <TableCell align="center" sx={{ backgroundColor: rowColor }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                <PersonIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {course.current_students || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    /{course.max_students || 0}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        
                                        <TableCell sx={{ backgroundColor: rowColor }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(course.updated_at)}
                                            </Typography>
                                        </TableCell>
                                        
                                        <TableCell align="center" sx={{ backgroundColor: rowColor }}>
                                            <Chip
                                                icon={<CompletedIcon />}
                                                label="Completed"
                                                color="success"
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );
};

export default InstructorArchiveTable; 