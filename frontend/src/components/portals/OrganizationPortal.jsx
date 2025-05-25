import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api.ts';
import logger from '../../utils/logger';
import ErrorBoundary from '../common/ErrorBoundary';
import analytics from '../../services/analytics';
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
    School as ClassManagementIcon,
    Groups as StudentsIcon,
    Person as ProfileIcon
} from '@mui/icons-material';
// Lazy load components for better performance
const ScheduleCourseForm = lazy(() => import('../forms/ScheduleCourseForm'));
const OrganizationCoursesTable = lazy(() => import('../tables/OrganizationCoursesTable'));
const StudentUploadDialog = lazy(() => import('../dialogs/StudentUploadDialog'));
const ViewStudentsDialog = lazy(() => import('../dialogs/ViewStudentsDialog'));
const OrganizationProfile = lazy(() => import('../views/organization/OrganizationProfile'));

const drawerWidth = 240;

// Loading component for Suspense fallbacks
const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
    </Box>
);

const OrganizationPortal = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
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

    // Analytics: Track user and page views
    useEffect(() => {
        if (user) {
            analytics.setUser(user.id || user.username, {
                role: user.role,
                portal: 'organization',
                organizationId: user.organizationId,
                organizationName: user.organizationName
            });
        }
    }, [user]);

    useEffect(() => {
        const currentView = getCurrentView();
        analytics.trackPageView(`organization_${currentView}`, {
            portal: 'organization',
            view: currentView,
            organizationId: user?.organizationId
        });
    }, [location.pathname, user?.organizationId]);

    // Error handler for error boundaries
    const handleError = (error, errorInfo) => {
        analytics.trackError(error, 'organization_portal', {
            componentStack: errorInfo.componentStack,
            view: getCurrentView(),
            organizationId: user?.organizationId
        });
    };

    // Get current view from URL or state
    const getCurrentView = () => {
        return selectedView;
    };

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
            setOrganizationCourses(response || []);
        } catch (err) {
            logger.error('Error fetching courses:', err);
            setCoursesError(err.message || 'Failed to load courses.');
            setOrganizationCourses([]);
        } finally {
            setIsLoadingCourses(false);
        }
    }, []);

    useEffect(() => {
        if (selectedView === 'myCourses' || selectedView === 'classManagement') {
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
            return (
                <ErrorBoundary onError={handleError}>
                    <Suspense fallback={<LoadingFallback />}>
                        <ScheduleCourseForm 
                            onCourseScheduled={(newCourse) => {
                                analytics.trackOrganizationAction('course_scheduled', { 
                                    courseId: newCourse?.id,
                                    organizationId: user?.organizationId 
                                });
                                handleCourseScheduled(newCourse);
                                loadOrgCourses(); // Refresh courses after scheduling
                            }} 
                        />
                    </Suspense>
                </ErrorBoundary>
            );
        }

        if (selectedView === 'classManagement') {
            if (isLoadingCourses) {
                return <LoadingFallback />;
            }
            if (coursesError) {
                return <Alert severity="error">{coursesError}</Alert>;
            }

            const confirmedCourses = organizationCourses.filter(course => 
                course.status?.toLowerCase() === 'confirmed'
            );

            return (
                <ErrorBoundary onError={handleError}>
                    <Box>
                        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StudentsIcon color="primary" />
                            Class Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            Upload and manage student lists for your confirmed courses.
                        </Typography>

                        {confirmedCourses.length === 0 ? (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    No confirmed courses available for student management. 
                                    Schedule a course first and wait for instructor assignment.
                                </Typography>
                            </Alert>
                        ) : (
                            <Suspense fallback={<LoadingFallback />}>
                                <OrganizationCoursesTable 
                                    courses={confirmedCourses}
                                    onUploadStudentsClick={(courseId) => {
                                        analytics.trackOrganizationAction('upload_students_click', { 
                                            courseId,
                                            organizationId: user?.organizationId 
                                        });
                                        handleUploadStudentsClick(courseId);
                                    }} 
                                    onViewStudentsClick={(courseId) => {
                                        analytics.trackOrganizationAction('view_students_click', { 
                                            courseId,
                                            organizationId: user?.organizationId 
                                        });
                                        handleViewStudentsClick(courseId);
                                    }}
                                    sortOrder={orgCoursesSortOrder}
                                    sortBy={orgCoursesSortBy}
                                    onSortRequest={handleOrgCoursesSortRequest}
                                />
                            </Suspense>
                        )}
                    </Box>
                </ErrorBoundary>
            );
        }

        if (selectedView === 'myCourses') {
            if (isLoadingCourses) {
                return <LoadingFallback />;
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
                <ErrorBoundary onError={handleError}>
                    <Box>
                        <Typography variant="h5" gutterBottom>
                            My Courses
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            View all your course requests and their current status.
                        </Typography>
                        <Suspense fallback={<LoadingFallback />}>
                            <OrganizationCoursesTable 
                                courses={sortedOrgCourses}
                                onUploadStudentsClick={(courseId) => {
                                    analytics.trackOrganizationAction('upload_students_click', { 
                                        courseId,
                                        organizationId: user?.organizationId 
                                    });
                                    handleUploadStudentsClick(courseId);
                                }} 
                                onViewStudentsClick={(courseId) => {
                                    analytics.trackOrganizationAction('view_students_click', { 
                                        courseId,
                                        organizationId: user?.organizationId 
                                    });
                                    handleViewStudentsClick(courseId);
                                }}
                                sortOrder={orgCoursesSortOrder}
                                sortBy={orgCoursesSortBy}
                                onSortRequest={handleOrgCoursesSortRequest}
                            />
                        </Suspense>
                    </Box>
                </ErrorBoundary>
            );
        }

        if (selectedView === 'profile') {
            return (
                <ErrorBoundary onError={handleError}>
                    <Suspense fallback={<LoadingFallback />}>
                        <OrganizationProfile showSnackbar={showSnackbar} />
                    </Suspense>
                </ErrorBoundary>
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
                         Welcome {user?.organizationName || user?.username || 'Organization User'}!
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
                            onClick={() => {
                                analytics.trackOrganizationAction('navigation', { 
                                    from: selectedView, 
                                    to: 'schedule',
                                    organizationId: user?.organizationId 
                                });
                                setSelectedView('schedule');
                            }}
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
                            onClick={() => {
                                analytics.trackOrganizationAction('navigation', { 
                                    from: selectedView, 
                                    to: 'myCourses',
                                    organizationId: user?.organizationId 
                                });
                                setSelectedView('myCourses');
                            }}
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
                        <ListItem 
                            component="div" 
                            selected={selectedView === 'classManagement'}
                            onClick={() => {
                                analytics.trackOrganizationAction('navigation', { 
                                    from: selectedView, 
                                    to: 'classManagement',
                                    organizationId: user?.organizationId 
                                });
                                setSelectedView('classManagement');
                            }}
                            sx={{
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selectedView === 'classManagement' ? 'primary.light' : 'transparent',
                                color: selectedView === 'classManagement' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selectedView === 'classManagement' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selectedView === 'classManagement' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon>
                                <ClassManagementIcon />
                            </ListItemIcon>
                            <ListItemText primary="Class Management" />
                        </ListItem>
                        <ListItem 
                            component="div" 
                            selected={selectedView === 'profile'}
                            onClick={() => {
                                analytics.trackOrganizationAction('navigation', { 
                                    from: selectedView, 
                                    to: 'profile',
                                    organizationId: user?.organizationId 
                                });
                                setSelectedView('profile');
                            }}
                            sx={{
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selectedView === 'profile' ? 'primary.light' : 'transparent',
                                color: selectedView === 'profile' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selectedView === 'profile' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selectedView === 'profile' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon>
                                <ProfileIcon />
                            </ListItemIcon>
                            <ListItemText primary="Profile" />
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
                <ErrorBoundary onError={handleError}>
                    <Container maxWidth="lg">
                        <Suspense fallback={<LoadingFallback />}>
                            {renderSelectedView()}
                        </Suspense>
                    </Container>
                </ErrorBoundary>
            </Box>

            <Suspense fallback={null}>
                <StudentUploadDialog
                    open={showUploadDialog}
                    onClose={handleUploadDialogClose}
                    courseId={selectedCourseForUpload}
                    onUploadComplete={(message) => {
                        analytics.trackOrganizationAction('students_uploaded', { 
                            courseId: selectedCourseForUpload,
                            organizationId: user?.organizationId 
                        });
                        handleUploadComplete(message);
                    }}
                />
            </Suspense>

            <Suspense fallback={null}>
                <ViewStudentsDialog
                    open={showViewStudentsDialog}
                    onClose={handleViewStudentsDialogClose}
                    courseId={selectedCourseForView}
                />
            </Suspense>

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