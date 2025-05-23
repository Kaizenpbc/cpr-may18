import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tab,
  Tabs,
  Button,
  AppBar,
  Toolbar,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import CourseManagement from './courseAdmin/CourseManagement';
import ClassManagement from './courseAdmin/ClassManagement';
import InstructorManagement from './courseAdmin/InstructorManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CourseAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (user?.role !== 'admin') {
    return (
      <Container>
        <Typography variant="h5" color="error" align="center" sx={{ mt: 4 }}>
          Access Denied: You must be a course administrator to view this page.
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            🎓 Course Administration Portal
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome {user?.username || 'Admin'}!
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Paper sx={{ p: 2 }}>
          <Typography component="h1" variant="h4" color="primary" gutterBottom>
            Course Administration
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              aria-label="course admin tabs"
            >
              <Tab label="Instructor Management" />
              <Tab label="Course Management" />
              <Tab label="Class Management" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <InstructorManagement />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <CourseManagement />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <ClassManagement />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default CourseAdminPortal; 