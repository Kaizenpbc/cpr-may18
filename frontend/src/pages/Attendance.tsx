import React, { useState, useMemo } from 'react';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField as MuiTextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AttendanceRecord {
  id: number;
  classId: number;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  instructor: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
}

type SortField = 'date' | 'className' | 'instructor' | 'status';
type SortOrder = 'asc' | 'desc';

const Attendance: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      try {
        const response = await api.get('/instructor/attendance');
        return response.data.data;
      } catch (error) {
        if (error.response?.status === 401) {
          await logout();
          navigate('/login');
        }
        throw error;
      }
    }
  });

  const handleOpen = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRecord(null);
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      case 'excused':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredAndSortedRecords = useMemo(() => {
    if (!records) return [];

    let filtered = records.filter((record: AttendanceRecord) => {
      const matchesSearch = 
        record.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a: AttendanceRecord, b: AttendanceRecord) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [records, searchQuery, statusFilter, sortField, sortOrder]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Records
      </Typography>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <MuiTextField
          placeholder="Search records..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: '200px' }}
        />
        <FormControl sx={{ minWidth: '150px' }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="late">Late</MenuItem>
            <MenuItem value="excused">Excused</MenuItem>
          </Select>
        </FormControl>
        
        <Tooltip title="Sort by Date">
          <IconButton onClick={() => handleSort('date')}>
            <SortIcon color={sortField === 'date' ? 'primary' : 'inherit'} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Sort by Class">
          <IconButton onClick={() => handleSort('className')}>
            <SortIcon color={sortField === 'className' ? 'primary' : 'inherit'} />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {filteredAndSortedRecords.map((record: AttendanceRecord) => (
          <Grid item xs={12} sm={6} md={4} key={record.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {record.className}
                  </Typography>
                  <Chip
                    label={record.status}
                    color={getStatusColor(record.status)}
                    size="small"
                  />
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  <EventIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {new Date(record.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Time: {record.startTime} - {record.endTime}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Instructor: {record.instructor}
                </Typography>
                {record.notes && (
                  <Typography variant="body2" color="text.secondary">
                    Notes: {record.notes}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleOpen(record)}>
                  Edit Record
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {selectedRecord?.id ? 'Edit Attendance Record' : 'Add New Record'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Class"
              margin="normal"
              value={selectedRecord?.className || ''}
            />
            <TextField
              fullWidth
              label="Date"
              margin="normal"
              type="date"
              value={selectedRecord?.date || ''}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Start Time"
              margin="normal"
              type="time"
              value={selectedRecord?.startTime || ''}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Time"
              margin="normal"
              type="time"
              value={selectedRecord?.endTime || ''}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedRecord?.status || ''}
                label="Status"
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="late">Late</MenuItem>
                <MenuItem value="excused">Excused</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes"
              margin="normal"
              multiline
              rows={3}
              value={selectedRecord?.notes || ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleClose}>
            {selectedRecord?.id ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Attendance; 