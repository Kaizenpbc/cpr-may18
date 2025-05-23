import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Container,
    Divider,
    Alert,
    Snackbar,
    AppBar,
    Toolbar
} from '@mui/material';
import {
    Business as OrganizationIcon,
    People as UserIcon,
    Category as CourseTypeIcon,
    PriceChange as PricingIcon,
    Logout as LogoutIcon,
    VpnKey as PasswordIcon,
} from '@mui/icons-material';
import OrganizationManager from '../admin/OrganizationManager';
import UserManager from '../admin/UserManager';
import CourseTypeManager from '../admin/CourseTypeManager';
import PricingRuleManager from '../admin/PricingRuleManager';

const drawerWidth = 240;

const SuperAdminPortal = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [selected_view, setSelectedView] = useState('organizations'); // Default view
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const handleLogout = () => {
        const first_name = user?.first_name || 'Super Admin';
        const logout_message = `Goodbye ${first_name}!`; // Simple message
        showSnackbar(logout_message, 'info');

        setTimeout(() => {
            logout();
            navigate('/');
        }, 1500);
    };

    const renderSelectedView = () => {
        logger.debug(`[SuperAdmin] Rendering view: ${selected_view}`);
        switch (selected_view) {
            case 'organizations':
                return <OrganizationManager />;
            case 'users':
                return <UserManager />;
            case 'course_types':
                return <CourseTypeManager />;
            case 'pricing':
                return <PricingRuleManager />;
            default:
                return <Typography>Select a management section</Typography>;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                logger.info('Fetching admin data');
                // ... existing fetch logic ...
                logger.info('Admin data fetched successfully');
            } catch (err) {
                logger.error('Error fetching admin data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
                        ⚡ Super Admin Portal
                    </Typography>
                    <Typography variant="body1" noWrap sx={{ mr: 2 }}>
                         Welcome {user?.username || user?.first_name || 'Super Admin'}!
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
                        {/* Organization Management */}
                        <ListItem 
                            component="div"
                            selected={selected_view === 'organizations'}
                            onClick={() => setSelectedView('organizations')}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selected_view === 'organizations' ? 'primary.light' : 'transparent',
                                color: selected_view === 'organizations' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selected_view === 'organizations' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selected_view === 'organizations' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}><OrganizationIcon /></ListItemIcon>
                            <ListItemText primary="Organizations" />
                        </ListItem>

                        {/* User Management */}
                        <ListItem 
                            component="div"
                            selected={selected_view === 'users'}
                            onClick={() => setSelectedView('users')}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selected_view === 'users' ? 'primary.light' : 'transparent',
                                color: selected_view === 'users' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selected_view === 'users' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selected_view === 'users' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}><UserIcon /></ListItemIcon>
                            <ListItemText primary="Users" />
                        </ListItem>

                         {/* Course Type Management */}
                         <ListItem 
                            component="div"
                            selected={selected_view === 'course_types'}
                            onClick={() => setSelectedView('course_types')}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selected_view === 'course_types' ? 'primary.light' : 'transparent',
                                color: selected_view === 'course_types' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selected_view === 'course_types' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selected_view === 'course_types' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}><CourseTypeIcon /></ListItemIcon>
                            <ListItemText primary="Course Types" />
                        </ListItem>

                        {/* Pricing Rules Management */}
                         <ListItem 
                            component="div"
                            selected={selected_view === 'pricing'}
                            onClick={() => setSelectedView('pricing')}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selected_view === 'pricing' ? 'primary.light' : 'transparent',
                                color: selected_view === 'pricing' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selected_view === 'pricing' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selected_view === 'pricing' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}><PricingIcon /></ListItemIcon>
                            <ListItemText primary="Pricing Rules" />
                        </ListItem>

                        <Divider sx={{ my: 1 }} />

                        {/* Password Reset Item */}
                        <ListItem 
                            component="div"
                            onClick={() => navigate('/reset-password')}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5,
                                '&:hover': { backgroundColor: 'action.hover'} 
                            }}
                        >
                            <ListItemIcon><PasswordIcon /></ListItemIcon>
                            <ListItemText primary="Reset Password" />
                        </ListItem>

                        {/* Logout Item */}
                        <ListItem 
                            component="div"
                            onClick={handleLogout}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5,
                                '&:hover': { backgroundColor: 'action.hover'} 
                            }}
                        >
                            <ListItemIcon><LogoutIcon /></ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                <Container maxWidth="lg">
                    {renderSelectedView()}
                </Container>
            </Box>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert 
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SuperAdminPortal; 