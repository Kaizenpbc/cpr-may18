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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { api } from '../../../services/api';

interface Instructor {
  id: number;
  username: string;
  email: string;
  availability?: {
    day: string;
    start_time: string;
    end_time: string;
  }[];
  active_classes: number;
}

interface AvailabilityFormData {
  day: string;
  start_time: string;
  end_time: string;
}

const InstructorManagement: React.FC = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [pendingCourses, setPendingCourses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
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
  const [availabilityData, setAvailabilityData] = useState<AvailabilityFormData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchInstructors();
    fetchPendingCourses();
  }, []);

  const fetchInstructors = async () => {
    try {
      const response = await api.get('/api/v1/instructors');
      setInstructors(response.data.data);
    } catch (err) {
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
      handleAssignClose();
    } catch (err) {
      setError('Failed to assign instructor');
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
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{new Date(course.date_requested).toLocaleDateString()}</TableCell>
                  <TableCell>{course.course_type}</TableCell>
                  <TableCell>{course.organization_name}</TableCell>
                  <TableCell>{course.location}</TableCell>
                  <TableCell>{course.registered_students}</TableCell>
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

      {/* Instructor Management Section */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Instructors</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Instructor
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Active Classes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {instructors.map((instructor) => (
              <TableRow key={instructor.id}>
                <TableCell>{instructor.username}</TableCell>
                <TableCell>{instructor.email}</TableCell>
                <TableCell>{instructor.active_classes}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(instructor)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleAvailabilityOpen(instructor)} color="info">
                    <ScheduleIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(instructor.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
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
            Set availability slots for {editingInstructor?.username}
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
                  {instructor.username} ({instructor.email})
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