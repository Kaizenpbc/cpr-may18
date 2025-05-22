import React from 'react';
import AvailabilityView from '../components/views/instructor/AvailabilityView';
import { Container, Typography, Box } from '@mui/material';

const InstructorAvailability: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manage Your Availability
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Use the calendar below to set your availability for teaching CPR classes.
        </Typography>
        <AvailabilityView />
      </Box>
    </Container>
  );
};

export default InstructorAvailability; 