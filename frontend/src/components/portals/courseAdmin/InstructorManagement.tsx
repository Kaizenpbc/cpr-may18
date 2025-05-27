import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert,
  Chip,
  Stack,
  MenuItem,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Schedule as ScheduleIcon, CalendarToday as CalendarIcon, Cancel as CancelIcon, Visibility as ViewIcon, AttachMoney as BillingIcon } from '@mui/icons-material';
import { api } from '../../../services/api';
import InstructorDashboard from './InstructorDashboard';
import AdminViewStudentsDialog from '../../dialogs/AdminViewStudentsDialog';

console.log('[InstructorManagement] Module loaded');

interface Instructor {
  id: number;
  instructor_name: string;
  username: string;
  email: string;
  availability_date?: string;
  availability_status?: string;
  assignment_status?: string;
  assigned_organization?: string;
  assigned_location?: string;
  assigned_course_type?: string;
  notes?: string;
  availability?: {
    day: string;
    start_time: string;
    end_time: string;
  }[];
}

interface AvailableInstructor {
  id: number;
  instructor_name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  availability_status?: string;
}

interface FormData {
  username: string;
  email: string;
  password: string;
}

interface AvailabilityFormData {
  day: string;
  start_time: string;
  end_time: string;
}

const InstructorManagement: React.FC = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [availableInstructors, setAvailableInstructors] = useState<AvailableInstructor[]>([]);
  const [pendingCourses, setPendingCourses] = useState<any[]>([]);
  const [confirmedCourses, setConfirmedCourses] = useState<any[]>([]);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editScheduleOpen, setEditScheduleOpen] = useState(false);
  const [cancelCourseOpen, setCancelCourseOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [viewingInstructor, setViewingInstructor] = useState<Instructor | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseToEdit, setCourseToEdit] = useState<any>(null);
  const [courseToCancel, setCourseToCancel] = useState<any>(null);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityFormData[]>([]);
  const [instructorSchedule, setInstructorSchedule] = useState<any[]>([]);
  const [instructorAvailability, setInstructorAvailability] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
  });
  const [assignmentData, setAssignmentData] = useState({
    instructorId: '',
    scheduledDate: '',
    startTime: '09:00',
    endTime: '12:00'
  });
  const [editScheduleData, setEditScheduleData] = useState({
    scheduledDate: '',
    startTime: '09:00',
    endTime: '12:00',
    instructorId: ''
  });
  const [cancelData, setCancelData] = useState({
    reason: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for viewing students
  const [viewStudentsOpen, setViewStudentsOpen] = useState(false);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState<any>(null);
  
  // State for showing/hiding completed assignments
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchInstructors();
    fetchPendingCourses();
    fetchConfirmedCourses();
    fetchCompletedCourses();
  }, []);

  const fetchInstructors = async () => {
    try {
      const response = await api.get('/api/v1/instructors');
      setInstructors(response.data.data);
    } catch (err) {
      console.error('Error fetching instructors:', err);
      setError('Failed to fetch instructors');
    }
  };

  const fetchPendingCourses = async () => {
    try {
      const response = await api.get('/api/v1/courses/pending');
      setPendingCourses(response.data.data);
    } catch (err) {
      setError('Failed to fetch pending courses');
    }
  };

  const fetchConfirmedCourses = async () => {
    try {
      const response = await api.get('/api/v1/courses/confirmed');
      setConfirmedCourses(response.data.data);
    } catch (err) {
      setError('Failed to fetch confirmed courses');
    }
  };

  const fetchCompletedCourses = async () => {
    try {
      const response = await api.get('/api/v1/courses/completed');
      setCompletedCourses(response.data.data);
    } catch (err) {
      setError('Failed to fetch completed courses');
    }
  };

  const handleOpen = (instructor?: Instructor) => {
    if (instructor) {
      setEditingInstructor(instructor);
      setFormData({
        username: instructor.username,
        email: instructor.email,
        password: '',
      });
    } else {
      setEditingInstructor(null);
      setFormData({
        username: '',
        email: '',
        password: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingInstructor(null);
  };

  const handleAvailabilityOpen = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setAvailabilityData(instructor.availability || []);
    setAvailabilityOpen(true);
  };

  const handleAvailabilityClose = () => {
    setAvailabilityOpen(false);
    setEditingInstructor(null);
    setAvailabilityData([]);
  };

  const handleScheduleOpen = async (instructor: Instructor) => {
    setViewingInstructor(instructor);
    setScheduleOpen(true);
    // Fetch instructor's actual schedule and availability
    await fetchInstructorScheduleData(instructor.id);
  };

  const handleScheduleClose = () => {
    setScheduleOpen(false);
    setViewingInstructor(null);
    setInstructorSchedule([]);
    setInstructorAvailability([]);
  };

  const fetchInstructorScheduleData = async (instructorId: number) => {
    try {
      // Note: These endpoints would need to be created for admin access to instructor data
      // For now, we'll show the structure
      const [scheduleRes, availabilityRes] = await Promise.all([
        api.get(`/api/v1/instructors/${instructorId}/schedule`),
        api.get(`/api/v1/instructors/${instructorId}/availability`)
      ]);
      setInstructorSchedule(scheduleRes.data.data || []);
      setInstructorAvailability(availabilityRes.data.data || []);
    } catch (err) {
      console.error('Error fetching instructor schedule:', err);
      // For demo purposes, we'll set empty arrays
      setInstructorSchedule([]);
      setInstructorAvailability([]);
    }
  };

  const handleAssignOpen = async (course: any) => {
    setSelectedCourse(course);
    setAssignmentData({
      instructorId: '',
      scheduledDate: course.scheduled_date || '',  // Pre-fill with the scheduled date from org
      startTime: '09:00',
      endTime: '12:00'
    });
    
    // Fetch available instructors for the scheduled date
    if (course.scheduled_date) {
      try {
        // Extract just the date part (YYYY-MM-DD) from the scheduled_date
        const dateOnly = course.scheduled_date.split('T')[0];
        const response = await api.get(`/api/v1/instructors/available/${dateOnly}`);
        setAvailableInstructors(response.data.data);
        
        if (response.data.data.length === 0) {
          setError(`No instructors are available on ${formatDateWithoutTimezone(course.scheduled_date)}. Instructors must mark their availability for this date.`);
        }
      } catch (err: any) {
        console.error('Error fetching available instructors:', err);
        console.error('Error response:', err.response);
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);
        
        if (err.response?.status === 401) {
          setError('Authentication error. Please log in again.');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view available instructors.');
        } else {
          setError(`Failed to fetch available instructors: ${err.response?.data?.error?.message || err.message}`);
        }
        setAvailableInstructors([]);
      }
    } else {
      setError('Course must have a scheduled date before assigning an instructor');
      setAvailableInstructors([]);
    }
    
    setAssignOpen(true);
  };

  const handleAssignClose = () => {
    setAssignOpen(false);
    setSelectedCourse(null);
  };

  const handleEditScheduleOpen = async (course: any) => {
    setCourseToEdit(course);
    setEditScheduleData({
      scheduledDate: course.confirmed_date || '',
      startTime: course.confirmed_start_time || '09:00',
      endTime: course.confirmed_end_time || '12:00',
      instructorId: course.instructor_id || ''
    });
    
    // Fetch available instructors for the confirmed date
    if (course.confirmed_date) {
      try {
        // Extract just the date part (YYYY-MM-DD) from the confirmed_date
        const dateOnly = course.confirmed_date.split('T')[0];
        const response = await api.get(`/api/v1/instructors/available/${dateOnly}`);
        // Include the current instructor even if they're not available (to allow keeping them)
        const availableList = response.data.data;
        if (course.instructor_id && !availableList.find((i: any) => i.id === course.instructor_id)) {
          // Add current instructor to the list
          availableList.unshift({
            id: course.instructor_id,
            instructor_name: course.instructor_name,
            email: '',
            availability_status: 'Currently Assigned'
          });
        }
        setAvailableInstructors(availableList);
      } catch (err) {
        console.error('Error fetching available instructors:', err);
        setAvailableInstructors([]);
      }
    }
    
    setEditScheduleOpen(true);
  };

  const handleEditScheduleClose = () => {
    setEditScheduleOpen(false);
    setCourseToEdit(null);
    setEditScheduleData({
      scheduledDate: '',
      startTime: '09:00',
      endTime: '12:00',
      instructorId: ''
    });
  };

  const handleCancelCourseOpen = (course: any) => {
    setCourseToCancel(course);
    setCancelData({ reason: '' });
    setCancelCourseOpen(true);
  };

  const handleCancelCourseClose = () => {
    setCancelCourseOpen(false);
    setCourseToCancel(null);
    setCancelData({ reason: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInstructor) {
        await api.put(`/api/v1/instructors/${editingInstructor.id}`, formData);
        setSuccess('Instructor updated successfully');
      } else {
        await api.post('/api/v1/instructors', formData);
        setSuccess('Instructor created successfully');
      }
      fetchInstructors();
      handleClose();
    } catch (err) {
      setError('Failed to save instructor');
    }
  };

  const handleAvailabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstructor) return;

    try {
      await api.put(`/api/v1/instructors/${editingInstructor.id}/availability`, {
        availability: availabilityData,
      });
      setSuccess('Availability updated successfully');
      fetchInstructors();
      handleAvailabilityClose();
    } catch (err) {
      setError('Failed to update availability');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this instructor?')) return;
    
    try {
      await api.delete(`/api/v1/instructors/${id}`);
      setSuccess('Instructor deleted successfully');
      fetchInstructors();
    } catch (err) {
      setError('Failed to delete instructor');
    }
  };

  const handleDeleteAvailability = async (instructorId: number, date: string) => {
    if (!window.confirm(`Are you sure you want to remove this availability record for ${formatDateWithoutTimezone(date)}? This will also remove any unconfirmed classes for this date.`)) return;
    
    try {
      await api.delete(`/api/v1/instructors/${instructorId}/availability/${date}`);
      setSuccess('Availability removed successfully');
      fetchInstructors();
    } catch (err: any) {
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else {
        setError('Failed to remove availability');
      }
    }
  };

  const addAvailabilitySlot = () => {
    setAvailabilityData([
      ...availabilityData,
      { day: '', start_time: '', end_time: '' },
    ]);
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailabilityData(availabilityData.filter((_, i) => i !== index));
  };

  const updateAvailabilitySlot = (index: number, field: keyof AvailabilityFormData, value: string) => {
    const newData = [...availabilityData];
    newData[index] = {
      ...newData[index],
      [field]: value,
    };
    setAvailabilityData(newData);
  };

  const handleAssignInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !assignmentData.instructorId) return;

    try {
      await api.put(`/api/v1/courses/${selectedCourse.id}/assign-instructor`, {
        instructorId: assignmentData.instructorId,
        startTime: assignmentData.startTime,
        endTime: assignmentData.endTime
      });
      setSuccess('Instructor assigned successfully! Course status updated to Confirmed.');
      
      // Refresh all data to ensure UI is in sync
      await Promise.all([
        fetchPendingCourses(),
        fetchConfirmedCourses(),
        fetchCompletedCourses(),
        fetchInstructors() // This will refresh the instructor availability display
      ]);
      
      handleAssignClose();
    } catch (err) {
      setError('Failed to assign instructor');
    }
  };

  const handleEditScheduleDateChange = async (newDate: string) => {
    setEditScheduleData(prev => ({ ...prev, scheduledDate: newDate }));
    
    // Fetch available instructors for the new date
    if (newDate) {
      try {
        // Ensure we only use the date part (YYYY-MM-DD)
        const dateOnly = newDate.split('T')[0];
        const response = await api.get(`/api/v1/instructors/available/${dateOnly}`);
        const availableList = response.data.data;
        
        // Check if current instructor is available on new date
        const currentInstructorAvailable = availableList.find((i: any) => i.id === editScheduleData.instructorId);
        
        if (!currentInstructorAvailable && editScheduleData.instructorId) {
          // Current instructor not available on new date
          setEditScheduleData(prev => ({ ...prev, instructorId: '' }));
          setError(`Current instructor is not available on ${formatDateWithoutTimezone(newDate)}. Please select a different instructor.`);
        }
        
        setAvailableInstructors(availableList);
      } catch (err) {
        console.error('Error fetching available instructors:', err);
        setAvailableInstructors([]);
      }
    }
  };

  const handleEditScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseToEdit) return;

    try {
      await api.put(`/api/v1/courses/${courseToEdit.id}/schedule`, {
        scheduledDate: editScheduleData.scheduledDate,
        startTime: editScheduleData.startTime,
        endTime: editScheduleData.endTime,
        instructorId: editScheduleData.instructorId
      });
      setSuccess('Course schedule updated successfully!');
      
      // Refresh all data to ensure UI is in sync
      await Promise.all([
        fetchPendingCourses(),
        fetchConfirmedCourses(),
        fetchCompletedCourses(),
        fetchInstructors() // This will refresh the instructor availability display
      ]);
      
      handleEditScheduleClose();
    } catch (err) {
      setError('Failed to update course schedule');
    }
  };

  const handleCancelCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseToCancel || !cancelData.reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    try {
      await api.put(`/api/v1/courses/${courseToCancel.id}/cancel`, {
        reason: cancelData.reason
      });
      setSuccess('Course cancelled successfully!');
      
      // Refresh all data to ensure UI is in sync
      await Promise.all([
        fetchPendingCourses(),
        fetchConfirmedCourses(),
        fetchCompletedCourses(),
        fetchInstructors() // This will refresh the instructor availability display
      ]);
      
      handleCancelCourseClose();
    } catch (err) {
      setError('Failed to cancel course');
    }
  };

  // Add this helper function near the top of the component
  const formatDateWithoutTimezone = (dateString: string): string => {
    if (!dateString || dateString === 'No availability set') return dateString;
    
    // Parse the date string directly without timezone conversion
    const dateParts = dateString.split('-');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2]);
      
      // Create date in local timezone to avoid UTC conversion
      const date = new Date(year, month, day);
      return date.toLocaleDateString();
    }
    
    return dateString;
  };

  const handleViewStudentsOpen = (course: any) => {
    setSelectedCourseForStudents(course);
    setViewStudentsOpen(true);
  };

  const handleViewStudentsClose = () => {
    setViewStudentsOpen(false);
    setSelectedCourseForStudents(null);
  };

  const handleReadyForBilling = async (courseId: number) => {
    try {
      await api.put(`/api/v1/courses/${courseId}/ready-for-billing`);
      setSuccess('Course marked as ready for billing');
      fetchCompletedCourses();
    } catch (err) {
      setError('Failed to mark course as ready for billing');
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Instructor Fairness Dashboard */}
      <InstructorDashboard />

      {/* Pending Course Requests Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Pending Course Requests
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date Requested</TableCell>
                <TableCell>Scheduled Date</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Course Type</TableCell>
                <TableCell>Students Registered</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="h6" color="textSecondary" sx={{ py: 4 }}>
                      NO COURSE PENDING
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pendingCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{formatDateWithoutTimezone(course.date_requested)}</TableCell>
                    <TableCell>
                      {course.scheduled_date ? formatDateWithoutTimezone(course.scheduled_date) : '-'}
                    </TableCell>
                    <TableCell>{course.organization_name}</TableCell>
                    <TableCell>{course.location}</TableCell>
                    <TableCell>{course.course_type}</TableCell>
                    <TableCell>{course.registered_students}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {course.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={course.status} color="warning" size="small" />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleAssignOpen(course)}
                        >
                          Assign Instructor
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          onClick={() => handleEditScheduleOpen(course)}
                        >
                          Edit Schedule
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleCancelCourseOpen(course)}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Instructor Management Section */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Instructor Availability & Assignments</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                color="primary"
              />
            }
            label="Show Completed"
          />
          <Button
            variant="outlined"
            onClick={fetchInstructors}
            sx={{ textTransform: 'none' }}
          >
            Refresh Data
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Instructor Name</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Date Available/Scheduled</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Organization</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Location</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Course Type</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Notes</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Status</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Actions</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {instructors
              .filter((instructor) => {
                // Filter based on showCompleted toggle
                if (!showCompleted && instructor.assignment_status === 'Completed') {
                  return false;
                }
                return true;
              })
              .map((instructor, index) => {
                return (
                  <TableRow key={`${instructor.id}-${instructor.availability_date}-${index}`}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {instructor.instructor_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {instructor.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {instructor.availability_date && instructor.availability_date !== 'No availability set' ? (
                          <Chip
                            label={formatDateWithoutTimezone(instructor.availability_date)}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ mb: 0.5 }}
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary" fontStyle="italic">
                            No availability set
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {instructor.assigned_organization || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {instructor.assigned_location || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {instructor.assigned_course_type || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: '200px', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' 
                        }}
                      >
                        {instructor.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={instructor.assignment_status}
                        color={
                          instructor.assignment_status === 'Confirmed' ? 'primary' : 
                          instructor.assignment_status === 'Completed' ? 'default' :
                          instructor.assignment_status === 'Available' ? 'success' :
                          'default'
                        }
                        size="small"
                        variant={instructor.assignment_status === 'Completed' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Instructor">
                        <IconButton onClick={() => handleOpen(instructor)} color="primary" size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Manage Weekly Availability">
                        <IconButton onClick={() => handleAvailabilityOpen(instructor)} color="info" size="small">
                          <ScheduleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Calendar & Schedule">
                        <IconButton onClick={() => handleScheduleOpen(instructor)} color="secondary" size="small">
                          <CalendarIcon />
                        </IconButton>
                      </Tooltip>
                      {instructor.availability_date && instructor.availability_date !== 'No availability set' && instructor.assignment_status !== 'Completed' && (
                        <Tooltip title="Remove this availability date">
                          <IconButton 
                            onClick={() => handleDeleteAvailability(instructor.id, instructor.availability_date!)} 
                            color="error" 
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirmed Courses Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Confirmed Courses
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date Requested</TableCell>
                <TableCell>Scheduled Date</TableCell>
                <TableCell>Confirmed Date</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Course Type</TableCell>
                <TableCell>Students Registered</TableCell>
                <TableCell>Students Attended</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Instructor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {confirmedCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{formatDateWithoutTimezone(course.date_requested)}</TableCell>
                  <TableCell>
                    {course.scheduled_date ? formatDateWithoutTimezone(course.scheduled_date) : '-'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {course.confirmed_date ? formatDateWithoutTimezone(course.confirmed_date) : '-'}
                    </Typography>
                    {course.confirmed_start_time && course.confirmed_end_time && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        {course.confirmed_start_time.slice(0,5)} - {course.confirmed_end_time.slice(0,5)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{course.organization_name}</TableCell>
                  <TableCell>{course.location}</TableCell>
                  <TableCell>{course.course_type}</TableCell>
                  <TableCell align="center">{course.registered_students}</TableCell>
                  <TableCell align="center">{course.students_attended || 0}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {course.notes || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary" fontWeight="medium">
                      {course.instructor_name || 'Not Assigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={course.status} color="success" size="small" />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewStudentsOpen(course)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => handleEditScheduleOpen(course)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleCancelCourseOpen(course)}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {confirmedCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                      No confirmed courses yet
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Completed Courses Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Completed Courses
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date Requested</TableCell>
                <TableCell>Date Scheduled</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Course Type</TableCell>
                <TableCell>Students Registered</TableCell>
                <TableCell>Students Attended</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Instructor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {completedCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{formatDateWithoutTimezone(course.date_requested)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {course.confirmed_date ? formatDateWithoutTimezone(course.confirmed_date) : '-'}
                    </Typography>
                    {course.confirmed_start_time && course.confirmed_end_time && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        {course.confirmed_start_time.slice(0,5)} - {course.confirmed_end_time.slice(0,5)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{course.organization_name}</TableCell>
                  <TableCell>{course.location}</TableCell>
                  <TableCell>{course.course_type}</TableCell>
                  <TableCell align="center">{course.registered_students}</TableCell>
                  <TableCell align="center">{course.students_attended || 0}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {course.notes || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary" fontWeight="medium">
                      {course.instructor_name || 'Not Assigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={course.status} color="info" size="small" />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewStudentsOpen(course)}
                      >
                        View Students
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<BillingIcon />}
                        onClick={() => handleReadyForBilling(course.id)}
                        disabled={course.ready_for_billing}
                      >
                        {course.ready_for_billing ? 'Sent to Billing' : 'Ready for Billing'}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {completedCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                      No completed courses yet
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Instructor Form Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingInstructor ? 'Edit Instructor' : 'Add Instructor'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="username"
            label="Username"
            type="text"
            fullWidth
            value={formData.username}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="password"
            label={editingInstructor ? 'New Password (optional)' : 'Password'}
            type="password"
            fullWidth
            value={formData.password}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {editingInstructor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={availabilityOpen} onClose={handleAvailabilityClose} maxWidth="md" fullWidth>
        <DialogTitle>Manage Instructor Availability</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Set availability slots for {editingInstructor?.instructor_name}
          </Typography>

          {availabilityData.map((slot, index) => (
            <Box key={index} sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                select
                label="Day"
                value={slot.day}
                onChange={(e) => updateAvailabilitySlot(index, 'day', e.target.value)}
                sx={{ minWidth: 120 }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value=""></option>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </TextField>
              <TextField
                type="time"
                label="Start Time"
                value={slot.start_time}
                onChange={(e) => updateAvailabilitySlot(index, 'start_time', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="time"
                label="End Time"
                value={slot.end_time}
                onChange={(e) => updateAvailabilitySlot(index, 'end_time', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="outlined"
                color="error"
                onClick={() => removeAvailabilitySlot(index)}
              >
                Remove
              </Button>
            </Box>
          ))}

          <Button
            variant="outlined"
            onClick={addAvailabilitySlot}
            sx={{ mt: 2 }}
          >
            Add Availability Slot
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAvailabilityClose}>Cancel</Button>
          <Button onClick={handleAvailabilitySubmit} color="primary">
            Save Availability
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule View Dialog */}
      <Dialog open={scheduleOpen} onClose={handleScheduleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          Instructor Schedule - {viewingInstructor?.instructor_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Available Dates
            </Typography>
            {instructorAvailability.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {instructorAvailability.map((avail, index) => (
                  <Chip
                    key={index}
                    label={formatDateWithoutTimezone(avail.date)}
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No availability dates set
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Scheduled Classes
            </Typography>
            {instructorSchedule.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Students</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {instructorSchedule.map((classItem, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDateWithoutTimezone(classItem.date)}</TableCell>
                        <TableCell>{classItem.time}</TableCell>
                        <TableCell>{classItem.type}</TableCell>
                        <TableCell>{classItem.location}</TableCell>
                        <TableCell>{classItem.current_students}/{classItem.max_students}</TableCell>
                        <TableCell>
                          <Chip 
                            label={classItem.status} 
                            color={classItem.status === 'scheduled' ? 'primary' : 'default'} 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No scheduled classes
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="body2" color="textSecondary">
              <strong>Note:</strong> This shows the instructor's calendar-based schedule and availability. 
              Instructors can manage their own availability through their portal.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleScheduleClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Instructor Dialog */}
      <Dialog open={assignOpen} onClose={handleAssignClose} maxWidth="md" fullWidth>
        <DialogTitle>Assign Instructor to Course</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
            Course Type: {selectedCourse?.course_type}<br/>
            Organization: {selectedCourse?.organization_name}<br/>
            Location: {selectedCourse?.location}<br/>
            Students: {selectedCourse?.registered_students}<br/>
            Scheduled Date: {selectedCourse?.scheduled_date ? formatDateWithoutTimezone(selectedCourse.scheduled_date) : 'Not set'}
          </Typography>

          <Stack spacing={2}>
            {availableInstructors.length === 0 ? (
              <Alert severity="warning">
                No instructors are available for {selectedCourse?.scheduled_date ? formatDateWithoutTimezone(selectedCourse.scheduled_date) : 'this date'}.
                <br />
                Instructors must mark their availability in their portal before they can be assigned to courses.
              </Alert>
            ) : (
              <TextField
                select
                label="Available Instructors"
                value={assignmentData.instructorId}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, instructorId: e.target.value }))}
                fullWidth
                required
                helperText={`${availableInstructors.length} instructor(s) available on ${formatDateWithoutTimezone(selectedCourse?.scheduled_date)}`}
              >
                <MenuItem value="">Select an instructor</MenuItem>
                {availableInstructors.map((instructor) => (
                  <MenuItem key={instructor.id} value={instructor.id}>
                    {instructor.instructor_name} ({instructor.email})
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              type="date"
              label="Course Date (from Organization Request)"
              value={assignmentData.scheduledDate}
              fullWidth
              disabled
              InputLabelProps={{ shrink: true }}
              helperText="This is the date requested by the organization"
            />

            <TextField
              type="time"
              label="Start Time"
              value={assignmentData.startTime}
              onChange={(e) => setAssignmentData(prev => ({ ...prev, startTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              type="time"
              label="End Time"
              value={assignmentData.endTime}
              onChange={(e) => setAssignmentData(prev => ({ ...prev, endTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssignClose}>Cancel</Button>
          <Button 
            onClick={handleAssignInstructor} 
            variant="contained" 
            color="primary"
            disabled={!assignmentData.instructorId || availableInstructors.length === 0}
          >
            Assign Instructor & Confirm Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={editScheduleOpen} onClose={handleEditScheduleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Course Schedule</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
            Course Type: {courseToEdit?.course_type}<br/>
            Organization: {courseToEdit?.organization_name}<br/>
            Location: {courseToEdit?.location}<br/>
            Students: {courseToEdit?.registered_students}
          </Typography>

          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              type="date"
              label="Scheduled Date"
              value={editScheduleData.scheduledDate}
              onChange={(e) => handleEditScheduleDateChange(e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Available Instructors"
              value={editScheduleData.instructorId}
              onChange={(e) => setEditScheduleData(prev => ({ ...prev, instructorId: e.target.value }))}
              fullWidth
              helperText={availableInstructors.length > 0 ? `${availableInstructors.length} instructor(s) available` : 'No instructors available for this date'}
            >
              <MenuItem value="">Select an instructor</MenuItem>
              {availableInstructors.map((instructor) => (
                <MenuItem key={instructor.id} value={instructor.id}>
                  {instructor.instructor_name} {instructor.availability_status === 'Currently Assigned' ? '(Currently Assigned)' : `(${instructor.email})`}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="time"
              label="Start Time"
              value={editScheduleData.startTime}
              onChange={(e) => setEditScheduleData(prev => ({ ...prev, startTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              type="time"
              label="End Time"
              value={editScheduleData.endTime}
              onChange={(e) => setEditScheduleData(prev => ({ ...prev, endTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditScheduleClose}>Cancel</Button>
          <Button 
            onClick={handleEditScheduleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!editScheduleData.scheduledDate}
          >
            Update Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Course Dialog */}
      <Dialog open={cancelCourseOpen} onClose={handleCancelCourseClose} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Course</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
            Course Type: {courseToCancel?.course_type}<br/>
            Organization: {courseToCancel?.organization_name}<br/>
            Location: {courseToCancel?.location}<br/>
            Students: {courseToCancel?.registered_students}
          </Typography>

          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            Are you sure you want to cancel this course? This action cannot be undone.
          </Typography>

          <TextField
            label="Reason for Cancellation"
            value={cancelData.reason}
            onChange={(e) => setCancelData(prev => ({ ...prev, reason: e.target.value }))}
            fullWidth
            multiline
            rows={4}
            required
            placeholder="Please provide a detailed reason for cancelling this course..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCourseClose}>Cancel</Button>
          <Button 
            onClick={handleCancelCourseSubmit} 
            variant="contained" 
            color="error"
            disabled={!cancelData.reason.trim()}
          >
            Cancel Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Students Dialog */}
      <AdminViewStudentsDialog
        open={viewStudentsOpen}
        onClose={handleViewStudentsClose}
        courseId={selectedCourseForStudents?.id || null}
        courseInfo={{
          course_type: selectedCourseForStudents?.course_type,
          organization_name: selectedCourseForStudents?.organization_name,
          location: selectedCourseForStudents?.location
        }}
      />
    </Box>
  );
};

console.log('[InstructorManagement] Component defined');
export default InstructorManagement;
console.log('[InstructorManagement] Module exported'); 