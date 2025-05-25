import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  Class as ClassIcon,
  AssignmentTurnedIn as AttendanceIcon,
  Archive as ArchiveIcon,
  Person as ProfileIcon,
  VpnKey as PasswordIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 240;

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
}

interface InstructorLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onRefresh?: () => void;
}

const InstructorLayout: React.FC<InstructorLayoutProps> = ({ 
  children, 
  currentView,
  onRefresh 
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/instructor/dashboard' },
    { id: 'availability', label: 'Schedule Availability', icon: <CalendarIcon />, path: '/instructor/availability' },
    { id: 'classes', label: 'My Classes', icon: <ClassIcon />, path: '/instructor/classes' },
    { id: 'attendance', label: 'Attendance', icon: <AttendanceIcon />, path: '/instructor/attendance' },
    { id: 'archive', label: 'Archive', icon: <ArchiveIcon />, path: '/instructor/archive' },
    { id: 'profile', label: 'Profile', icon: <ProfileIcon />, path: '/instructor/profile' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handlePasswordReset = () => {
    navigate('/reset-password');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🏥 Instructor Portal
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {user?.username || 'Instructor'}
          </Typography>
          {onRefresh && (
            <Tooltip title="Refresh data">
              <IconButton color="inherit" onClick={onRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navItems.map((item) => (
              <ListItem
                key={item.id}
                component="div"
                onClick={() => handleNavigation(item.path)}
                selected={currentView === item.id}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: currentView === item.id ? 'primary.light' : 'transparent',
                  color: currentView === item.id ? 'primary.contrastText' : 'inherit',
                  '&:hover': {
                    backgroundColor: currentView === item.id ? 'primary.main' : 'action.hover',
                  },
                  '& .MuiListItemIcon-root': {
                    color: currentView === item.id ? 'primary.contrastText' : 'inherit',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <List>
            <ListItem
              component="div"
              onClick={handlePasswordReset}
              sx={{
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <ListItemIcon><PasswordIcon /></ListItemIcon>
              <ListItemText primary="Reset Password" />
            </ListItem>

            <ListItem
              component="div"
              onClick={handleLogout}
              sx={{
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default InstructorLayout; 