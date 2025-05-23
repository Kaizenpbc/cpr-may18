import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { Class, ApiResponse } from '../types/api';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Classes: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<Class[]>>('/instructor/classes');
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          await logout();
          navigate('/login');
        }
        throw error;
      }
    }
  });

  const handleOpen = (classItem: Class) => {
    setSelectedClass(classItem);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedClass(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">My Classes</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen({} as Class)}
        >
          Add Class
        </Button>
      </Box>

      <Grid container spacing={3}>
        {classes?.data?.map((classItem: Class) => (
          <Grid item xs={12} sm={6} md={4} key={classItem.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Class {classItem.id}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  Date: {new Date(classItem.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  Time: {classItem.startTime} - {classItem.endTime}
                </Typography>
                <Typography variant="body2">
                  Status: {classItem.status}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary" onClick={() => handleOpen(classItem)}>
                  View Details
                </Button>
                <Button size="small" color="primary" onClick={() => {}}>
                  Take Attendance
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {selectedClass?.id ? 'Edit Class' : 'Add New Class'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Type"
              margin="normal"
              value={selectedClass?.type || ''}
            />
            <TextField
              fullWidth
              label="Date"
              margin="normal"
              type="date"
              value={selectedClass?.date || ''}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Start Time"
              margin="normal"
              type="time"
              value={selectedClass?.startTime || ''}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Time"
              margin="normal"
              type="time"
              value={selectedClass?.endTime || ''}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Status"
              margin="normal"
              value={selectedClass?.status || ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleClose}>
            {selectedClass?.id ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Classes; 