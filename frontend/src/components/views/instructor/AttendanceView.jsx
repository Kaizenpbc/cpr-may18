import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Select, MenuItem, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Checkbox, Paper, Alert, CircularProgress, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, IconButton, Tooltip,
    Card, CardContent, Chip
} from '@mui/material';
import {
    Add as AddIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import api from '../../../services/api.ts';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AttendanceView = ({ onAttendanceUpdate }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [todaysClasses, setTodaysClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [error, setError] = useState('');
    const [addStudentDialog, setAddStudentDialog] = useState(false);
    const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', email: '' });

    // Load today's classes on component mount
    useEffect(() => {
        loadTodaysClasses();
    }, []);

    // Load students when a class is selected
    useEffect(() => {
        if (selectedClass) {
            loadStudents(selectedClass.course_id);
        }
    }, [selectedClass]);

    const loadTodaysClasses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/v1/instructor/classes/today');
            setTodaysClasses(response.data.data);
            
            // Auto-select the first class if only one exists
            if (response.data.data.length === 1) {
                setSelectedClass(response.data.data[0]);
            }
            
            setError('');
        } catch (error) {
            console.error('Error loading today\'s classes:', error);
            if (error.response?.status === 401) {
                await logout();
                navigate('/login');
                return;
            }
            setError('Failed to load today\'s classes');
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async (classId) => {
        try {
            setStudentsLoading(true);
            const response = await api.get(`/api/v1/instructor/classes/${classId}/students`);
            setStudents(response.data.data);
            setError('');
        } catch (error) {
            console.error('Error loading students:', error);
            if (error.response?.status === 401) {
                await logout();
                navigate('/login');
                return;
            }
            setError('Failed to load students for this class');
        } finally {
            setStudentsLoading(false);
        }
    };

    const handleClassChange = (event) => {
        const classId = event.target.value;
        const selected = todaysClasses.find(c => c.course_id === classId);
        setSelectedClass(selected);
    };

    const handleAttendanceChange = async (studentId, attended) => {
        if (!selectedClass) return;
        
        try {
            const response = await api.put(
                `/api/v1/instructor/classes/${selectedClass.course_id}/students/${studentId}/attendance`,
                { attended }
            );
            
            // Update local state
            setStudents(prev => prev.map(student => 
                student.studentid === studentId 
                    ? { ...student, attendance: attended, attendanceMarked: true }
                    : student
            ));
            
            // Call onAttendanceUpdate to refresh parent's scheduled classes data
            if (onAttendanceUpdate) {
                onAttendanceUpdate();
            }
            
        } catch (error) {
            console.error('Error updating attendance:', error);
            if (error.response?.status === 401) {
                await logout();
                navigate('/login');
                return;
            }
            setError('Failed to update attendance');
        }
    };

    const handleAddStudent = async () => {
        if (!selectedClass || !newStudent.firstName || !newStudent.lastName) {
            setError('Please fill in at least first and last name');
            return;
        }
        
        try {
            const response = await api.post(
                `/api/v1/instructor/classes/${selectedClass.course_id}/students`,
                newStudent
            );
            
            // Add new student to the list
            setStudents(prev => [...prev, response.data.data]);
            
            // Clear form and close dialog
            setNewStudent({ firstName: '', lastName: '', email: '' });
            setAddStudentDialog(false);
            setError('');
            
            // Call onAttendanceUpdate to refresh parent's scheduled classes data
            if (onAttendanceUpdate) {
                onAttendanceUpdate();
            }
            
        } catch (error) {
            console.error('Error adding student:', error);
            if (error.response?.status === 401) {
                await logout();
                navigate('/login');
                return;
            }
            setError('Failed to add student');
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.slice(0, 5); // Convert "09:00:00" to "09:00"
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon />
                Today's Attendance
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {todaysClasses.length === 0 ? (
                <Card sx={{ mt: 2 }}>
                    <CardContent>
                        <Typography variant="h6" color="text.secondary" align="center">
                            No classes scheduled for today
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                            Check back on days when you have scheduled classes.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Class Selection */}
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Select Class for Attendance
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel>Today's Classes</InputLabel>
                            <Select
                                value={selectedClass?.course_id || ''}
                                label="Today's Classes"
                                onChange={handleClassChange}
                            >
                                {todaysClasses.map((course) => (
                                    <MenuItem key={course.course_id} value={course.course_id}>
                                        <Box>
                                            <Typography variant="body1">
                                                {course.coursetypename} - {course.organizationname}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatTime(course.start_time)} - {formatTime(course.end_time)} | {course.location}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Paper>

                    {/* Student Management */}
                    {selectedClass && (
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Student Attendance
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setAddStudentDialog(true)}
                                    size="small"
                                >
                                    Add Student
                                </Button>
                            </Box>

                            {/* Class Info */}
                            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    {selectedClass.coursetypename} - {selectedClass.organizationname}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Chip icon={<ScheduleIcon />} label={`${formatTime(selectedClass.start_time)} - ${formatTime(selectedClass.end_time)}`} size="small" />
                                    <Chip icon={<PersonIcon />} label={`${students.length} Students`} size="small" />
                                    <Chip label={selectedClass.location} size="small" variant="outlined" />
                                </Box>
                            </Box>

                            {/* Students Table */}
                            {studentsLoading ? (
                                <Box display="flex" justifyContent="center" p={2}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : students.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        No Students Registered
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Add students to this class to mark attendance
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Present</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {students.map((student) => (
                                                <TableRow key={student.studentid}>
                                                    <TableCell>
                                                        {student.firstname} {student.lastname}
                                                    </TableCell>
                                                    <TableCell>
                                                        {student.email || '-'}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Checkbox
                                                            checked={student.attendance || false}
                                                            onChange={(e) => handleAttendanceChange(student.studentid, e.target.checked)}
                                                            color="primary"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={student.attendanceMarked ? (student.attendance ? 'Present' : 'Absent') : 'Not Marked'}
                                                            color={student.attendanceMarked ? (student.attendance ? 'success' : 'error') : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    )}
                </>
            )}

            {/* Add Student Dialog */}
            <Dialog open={addStudentDialog} onClose={() => setAddStudentDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Student to Class</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="First Name"
                            value={newStudent.firstName}
                            onChange={(e) => setNewStudent(prev => ({ ...prev, firstName: e.target.value }))}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Last Name"
                            value={newStudent.lastName}
                            onChange={(e) => setNewStudent(prev => ({ ...prev, lastName: e.target.value }))}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Email (Optional)"
                            value={newStudent.email}
                            onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                            margin="normal"
                            type="email"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddStudentDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddStudent} variant="contained">Add Student</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AttendanceView; 