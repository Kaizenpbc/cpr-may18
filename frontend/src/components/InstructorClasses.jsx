import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
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

const InstructorClasses = ({ completed = false }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const endpoint = completed ? '/instructor/classes/completed' : '/instructor/classes';
        const response = await api.get(endpoint);
        setClasses(response.data.data || []);
        setError(null);
      } catch (error) {
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
  }, [completed]);

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
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((classItem) => (
              <TableRow key={classItem.id}>
                <TableCell>{format(new Date(classItem.date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{`${classItem.startTime} - ${classItem.endTime}`}</TableCell>
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