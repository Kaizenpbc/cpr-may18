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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Schedule as ScheduleIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import { api } from '../../../services/api';

interface Instructor {
  id: number;
  instructor_name: string;
  username: string;
  email: string;
  availability_date?: string;
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
  const [pendingCourses, setPendingCourses] = useState<any[]>([]);
  const [confirmedCourses, setConfirmedCourses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [viewingInstructor, setViewingInstructor] = useState<Instructor | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchInstructors();
    fetchPendingCourses();
    fetchConfirmedCourses();
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

  const handleAssignOpen = (course: any) => {
    setSelectedCourse(course);
    setAssignmentData({
      instructorId: '',
      scheduledDate: '',
      startTime: '09:00',
      endTime: '12:00'
    });
    setAssignOpen(true);
  };

  const handleAssignClose = () => {
    setAssignOpen(false);
    setSelectedCourse(null);
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
        scheduledDate: assignmentData.scheduledDate,
        startTime: assignmentData.startTime,
        endTime: assignmentData.endTime
      });
      setSuccess('Instructor assigned successfully! Course status updated to Confirmed.');
      fetchPendingCourses();
      fetchConfirmedCourses();
      handleAssignClose();
    } catch (err) {
      setError('Failed to assign instructor');
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
                <TableCell>Course Type</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Students</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Instructor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{formatDateWithoutTimezone(course.date_requested)}</TableCell>
                  <TableCell>{course.course_type}</TableCell>
                  <TableCell>{course.organization_name}</TableCell>
                  <TableCell>{course.location}</TableCell>
                  <TableCell>{course.registered_students}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {course.notes || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={course.instructor_name ? 'primary' : 'textSecondary'}>
                      {course.instructor_name || 'Not Assigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={course.status} color="warning" size="small" />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleAssignOpen(course)}
                    >
                      Assign Instructor
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

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
                <TableCell>Course Type</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Students</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Instructor</TableCell>
                <TableCell>Scheduled Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {confirmedCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{formatDateWithoutTimezone(course.date_requested)}</TableCell>
                  <TableCell>{course.course_type}</TableCell>
                  <TableCell>{course.organization_name}</TableCell>
                  <TableCell>{course.location}</TableCell>
                  <TableCell>{course.registered_students}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {course.notes || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary" fontWeight="medium">
                      {course.instructor_name || 'Not Assigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {course.scheduled_date ? formatDateWithoutTimezone(course.scheduled_date) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {course.scheduled_start_time && course.scheduled_end_time 
                        ? `${course.scheduled_start_time.slice(0,5)} - ${course.scheduled_end_time.slice(0,5)}`
                        : '-'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={course.status} color="success" size="small" />
                  </TableCell>
                </TableRow>
              ))}
              {confirmedCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
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

      {/* Instructor Management Section */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Instructor Availability & Assignments</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={fetchInstructors}
            sx={{ textTransform: 'none' }}
          >
            Refresh Data
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Instructor
          </Button>
        </Stack>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Instructor Name</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Date Available</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Organization</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Location</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Course Type</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Notes</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Status</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight="bold">Actions</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {instructors.map((instructor, index) => {
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
                      color={instructor.assignment_status === 'Confirmed' ? 'primary' : 'success'}
                      size="small"
                      variant="outlined"
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
                    <Tooltip title="Delete Instructor">
                      <IconButton onClick={() => handleDelete(instructor.id)} color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

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
            Students: {selectedCourse?.registered_students}
          </Typography>

          <Stack spacing={2}>
            <TextField
              select
              label="Instructor"
              value={assignmentData.instructorId}
              onChange={(e) => setAssignmentData(prev => ({ ...prev, instructorId: e.target.value }))}
              fullWidth
              required
            >
              <MenuItem value="">Select an instructor</MenuItem>
              {instructors.map((instructor) => (
                <MenuItem key={instructor.id} value={instructor.id}>
                  {instructor.instructor_name} ({instructor.email})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              label="Scheduled Date"
              value={assignmentData.scheduledDate}
              onChange={(e) => setAssignmentData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
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
            disabled={!assignmentData.instructorId || !assignmentData.scheduledDate}
          >
            Assign Instructor & Confirm Course
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstructorManagement; 