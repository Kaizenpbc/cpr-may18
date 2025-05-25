import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import { Course, ApiResponse, PaginatedResponse } from '../types/instructor';

interface InstructorClassesProps {
  completed?: boolean;
}

const InstructorClasses: React.FC<InstructorClassesProps> = ({ completed = false }) => {
  const [classes, setClasses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();

  useEffect(() => {
    const fetchClasses = async (): Promise<void> => {
      try {
        const endpoint = completed ? '/api/v1/instructor/classes/completed' : '/api/v1/instructor/classes';
        const response = await api.get<ApiResponse<Course[]> | PaginatedResponse<Course>>(endpoint);
        
        if (response.data.success) {
          // Handle both regular response and paginated response
          const classData = 'data' in response.data ? response.data.data : [];
          setClasses(Array.isArray(classData) ? classData : []);
        }
        setError(null);
      } catch (error: any) {
        if (error.response?.status === 401) {
          await logout();
          window.location.href = '/login';
          return;
        }
        setError('Failed to fetch classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [completed, logout]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (classes.length === 0) {
    return (
      <Container>
        <Typography variant="h6">No classes {completed ? 'completed' : 'scheduled'}</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Course Type</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((classItem) => (
              <TableRow key={classItem.id || classItem.course_id}>
                <TableCell>
                  {format(new Date(classItem.start_date), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  {`${classItem.start_time} - ${classItem.end_time}`}
                </TableCell>
                <TableCell>{classItem.course_type}</TableCell>
                <TableCell>{classItem.organization_name}</TableCell>
                <TableCell>{classItem.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default InstructorClasses; 