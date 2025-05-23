import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';
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
    CircularProgress,
    Alert,
    Snackbar,
    AppBar,
    Toolbar
} from '@mui/material';
import {
    EditCalendar as ScheduleIcon,
    ListAlt as ListIcon,
    Logout as LogoutIcon,
    VpnKey as PasswordIcon,
} from '@mui/icons-material';
import ScheduleCourseForm from '../forms/ScheduleCourseForm';
import OrganizationCoursesTable from '../tables/OrganizationCoursesTable';
import StudentUploadDialog from '../dialogs/StudentUploadDialog';
import ViewStudentsDialog from '../dialogs/ViewStudentsDialog';

const drawerWidth = 240;

const OrganizationPortal = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [selectedView, setSelectedView] = useState('myCourses');
    const [organizationCourses, setOrganizationCourses] = useState([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);
    const [coursesError, setCoursesError] = useState('');
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [selectedCourseForUpload, setSelectedCourseForUpload] = useState(null);
    const [showViewStudentsDialog, setShowViewStudentsDialog] = useState(false);
    const [selectedCourseForView, setSelectedCourseForView] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [orgCoursesSortOrder, setOrgCoursesSortOrder] = useState('asc');
    const [orgCoursesSortBy, setOrgCoursesSortBy] = useState('date_requested');

    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const handleLogout = () => {
        const firstName = user?.first_name || 'Org User';
        const logoutMessage = `Good Bye ${firstName}, Have a Pleasant Day!`;
        showSnackbar(logoutMessage, 'info');
        
        setTimeout(() => {
            logout();
            navigate('/');
        }, 1500); 
    };

    const loadOrgCourses = useCallback(async () => {
        setIsLoadingCourses(true);
        setCoursesError('');
        try {
            logger.info('Fetching organization courses...');
            const response = await api.organizationApi.getMyCourses();
            logger.info('Organization courses response:', response);
            setOrganizationCourses(response.data || []);
        } catch (err) {
            logger.error('Error fetching courses:', err);
            setCoursesError(err.message || 'Failed to load courses.');
            setOrganizationCourses([]);
        } finally {
            setIsLoadingCourses(false);
        }
    }, []);

    useEffect(() => {
        if (selectedView === 'myCourses') {
            loadOrgCourses();
        }
    }, [selectedView, loadOrgCourses]);

    const handleCourseScheduled = (newCourse) => {
        logger.info('Course scheduled (in parent portal):', newCourse);
    };

    const handleUploadStudentsClick = (course_id) => {
        logger.info("Upload students clicked for course:", course_id);
        setSelectedCourseForUpload(course_id);
        setShowUploadDialog(true);
    };

    const handleViewStudentsClick = (course_id) => {
        logger.info("[OrgPortal] handleViewStudentsClick CALLED with course_id:", course_id);
        setSelectedCourseForView(course_id);
        setShowViewStudentsDialog(true);
    };
    
    const handleUploadDialogClose = () => {
        setShowUploadDialog(false);
        setSelectedCourseForUpload(null);
    };

    const handleViewStudentsDialogClose = () => {
        setShowViewStudentsDialog(false);
        setSelectedCourseForView(null);
    };

    const handleUploadComplete = (message) => {
        setSnackbar({ open: true, message: message, severity: 'success' });
        loadOrgCourses();
    };

    const handleOrgCoursesSortRequest = (property) => {
        if (property === 'date_requested') { 
            const isAsc = orgCoursesSortBy === property && orgCoursesSortOrder === 'asc';
            setOrgCoursesSortOrder(isAsc ? 'desc' : 'asc');
            setOrgCoursesSortBy(property);
        }
    };

    const handleEdit = () => {
        // ... existing handleEdit code ...
    };

    const renderSelectedView = () => {
        if (selectedView === 'schedule') {
            return <ScheduleCourseForm onCourseScheduled={handleCourseScheduled} />;
        }

        if (selectedView === 'myCourses') {
            if (isLoadingCourses) {
                return <CircularProgress />;
            }
            if (coursesError) {
                return <Alert severity="error">{coursesError}</Alert>;
            }

            const sortedOrgCourses = [...organizationCourses].sort((a, b) => {
                const compareA = new Date(a.date_requested || 0); 
                const compareB = new Date(b.date_requested || 0);
                
                if (compareB < compareA) {
                    return (orgCoursesSortOrder === 'asc' ? 1 : -1);
                }
                if (compareB > compareA) {
                    return (orgCoursesSortOrder === 'asc' ? -1 : 1);
                }
                return 0;
            });

            return (
                <OrganizationCoursesTable 
                    courses={sortedOrgCourses}
                    onUploadStudentsClick={handleUploadStudentsClick} 
                    onViewStudentsClick={handleViewStudentsClick}
                    sortOrder={orgCoursesSortOrder}
                    sortBy={orgCoursesSortBy}
                    onSortRequest={handleOrgCoursesSortRequest}
                />
            );
        }

        return null;
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} 
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
                        🏢 Organization Portal
                    </Typography>
                    <Typography variant="body1" noWrap sx={{ mr: 2 }}>
                         Welcome {user?.username || user?.organizationName || 'Organization User'}!
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
                        <ListItem 
                            component="div" 
                            selected={selectedView === 'schedule'}
                            onClick={() => setSelectedView('schedule')}
                            sx={{
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selectedView === 'schedule' ? 'primary.light' : 'transparent',
                                color: selectedView === 'schedule' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selectedView === 'schedule' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selectedView === 'schedule' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon>
                                <ScheduleIcon />
                            </ListItemIcon>
                            <ListItemText primary="Schedule Course" />
                        </ListItem>
                        <ListItem 
                            component="div" 
                            selected={selectedView === 'myCourses'}
                            onClick={() => setSelectedView('myCourses')}
                            sx={{
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selectedView === 'myCourses' ? 'primary.light' : 'transparent',
                                color: selectedView === 'myCourses' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selectedView === 'myCourses' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selectedView === 'myCourses' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon>
                                <ListIcon />
                            </ListItemIcon>
                            <ListItemText primary="My Courses" />
                        </ListItem>
                        <Divider />
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
                {renderSelectedView()}
            </Box>

            <StudentUploadDialog
                open={showUploadDialog}
                onClose={handleUploadDialogClose}
                courseId={selectedCourseForUpload}
                onUploadComplete={handleUploadComplete}
            />

            <ViewStudentsDialog
                open={showViewStudentsDialog}
                onClose={handleViewStudentsDialogClose}
                courseId={selectedCourseForView}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default OrganizationPortal; 