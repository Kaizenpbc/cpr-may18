import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sysAdminApi, getOrganizations } from '../../services/api.ts';
import logger from '../../utils/logger';
import {
    Box,
    Container,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    AppBar,
    Toolbar,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    School as CourseIcon,
    People as UsersIcon,
    Business as VendorIcon,
    Logout as LogoutIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import SystemAdminDashboard from '../sysadmin/SystemAdminDashboard';
import CourseManagement from '../sysadmin/CourseManagement';
import UserManagement from '../sysadmin/UserManagement';
import VendorManagement from '../sysadmin/VendorManagement';

const drawerWidth = 240;

const SystemAdminPortal = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [selectedView, setSelectedView] = useState('dashboard');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleLogout = () => {
        const firstName = user?.first_name || 'System Admin';
        const logoutMessage = `Goodbye ${firstName}, System Secured!`;
        showSnackbar(logoutMessage, 'info');
        
        setTimeout(() => {
            logout();
            navigate('/');
        }, 1500);
    };

    const menuItems = [
        { key: 'dashboard', label: 'System Dashboard', icon: <DashboardIcon /> },
        { key: 'courses', label: 'Course Management', icon: <CourseIcon /> },
        { key: 'users', label: 'User Management', icon: <UsersIcon /> },
        { key: 'vendors', label: 'Vendor Management', icon: <VendorIcon /> }
    ];

    const renderSelectedView = () => {
        switch (selectedView) {
            case 'dashboard':
                return <SystemAdminDashboard onShowSnackbar={showSnackbar} />;
            case 'courses':
                return <CourseManagement onShowSnackbar={showSnackbar} />;
            case 'users':
                return <UserManagement onShowSnackbar={showSnackbar} />;
            case 'vendors':
                return <VendorManagement onShowSnackbar={showSnackbar} />;
            default:
                return <SystemAdminDashboard onShowSnackbar={showSnackbar} />;
        }
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <Toolbar>
                    <SettingsIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        System Administration Portal
                    </Typography>
                    <Typography variant="body1" noWrap sx={{ mr: 2 }}>
                        Welcome {user?.username || 'System Administrator'}!
                    </Typography>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem
                                key={item.key}
                                component="div"
                                selected={selectedView === item.key}
                                onClick={() => setSelectedView(item.key)}
                                sx={{
                                    cursor: 'pointer',
                                    py: 1.5,
                                    backgroundColor: selectedView === item.key ? 'primary.light' : 'transparent',
                                    color: selectedView === item.key ? 'primary.contrastText' : 'inherit',
                                    '& .MuiListItemIcon-root': {
                                        color: selectedView === item.key ? 'primary.contrastText' : 'inherit',
                                    },
                                    '&:hover': {
                                        backgroundColor: selectedView === item.key ? 'primary.main' : 'action.hover',
                                    }
                                }}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItem>
                        ))}
                        <Divider sx={{ my: 1 }} />
                        <ListItem
                            component="div"
                            onClick={handleLogout}
                            sx={{
                                cursor: 'pointer',
                                py: 1.5,
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon>
                                <LogoutIcon />
                            </ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                <Container maxWidth="xl">
                    {renderSelectedView()}
                </Container>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SystemAdminPortal; 