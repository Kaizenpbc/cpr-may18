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
    Select,
    MenuItem,
    Button,
    CircularProgress,
} from '@mui/material';
import { formatDate } from '../../utils/formatters';

const AttendanceView = ({
    scheduledClasses,
    classToManage,
    handleClassChange,
    studentsForAttendance,
    handleAttendanceChange,
    isLoadingStudents,
    studentsError,
    handleMarkCompleteClick,
}) => {
    const selectedClass = classToManage;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Manage Attendance
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Select
                    value={classToManage?.courseid || ''}
                    onChange={handleClassChange}
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    <MenuItem value="">Select a class</MenuItem>
                    {Array.isArray(scheduledClasses) && scheduledClasses.map((course) => (
                        <MenuItem key={course.courseid} value={course.courseid}>
                            {course.coursetypename} - {course.organizationname} ({new Date(course.datescheduled).toLocaleDateString()})
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            {selectedClass && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Class Details
                    </Typography>
                    <Typography>Course: {selectedClass.coursetypename}</Typography>
                    <Typography>Date: {new Date(selectedClass.datescheduled).toLocaleDateString()}</Typography>
                    <Typography>Location: {selectedClass.location}</Typography>
                    <Typography>Organization: {selectedClass.organizationname}</Typography>
                </Paper>
            )}

            {isLoadingStudents ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : studentsError ? (
                <Typography color="error">{studentsError}</Typography>
            ) : Array.isArray(studentsForAttendance) && studentsForAttendance.length > 0 ? (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Student Name</TableCell>
                                <TableCell>Attendance</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {studentsForAttendance.map((student) => (
                                <TableRow key={student.studentid}>
                                    <TableCell>
                                        {student.firstname} {student.lastname}
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={student.attendance || 'present'}
                                            onChange={(e) => handleAttendanceChange(student.studentid, e.target.value)}
                                            fullWidth
                                        >
                                            <MenuItem value="present">Present</MenuItem>
                                            <MenuItem value="absent">Absent</MenuItem>
                                            <MenuItem value="late">Late</MenuItem>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography>No students enrolled in this class</Typography>
            )}

            {selectedClass && !selectedClass.completed && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleMarkCompleteClick(selectedClass.courseid)}
                    >
                        Mark Class as Complete
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default AttendanceView; 