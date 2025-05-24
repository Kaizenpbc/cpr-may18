import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
    Box,
    Container,
    Typography,
    Paper,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Snackbar,
    AppBar,
    Toolbar,
    Divider,
    Alert,
    CircularProgress,
    Grid,
    IconButton,
    Tooltip,
    Tabs,
    Tab
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    Class as ClassIcon,
    AssignmentTurnedIn as AttendanceIcon,
    Archive as ArchiveIcon,
    Dashboard as DashboardIcon,
    Person as StudentIcon,
    Event as CourseIcon,
    Logout as LogoutIcon,
    VpnKey as PasswordIcon,
    Warning as WarningIcon,
    CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { formatDate, formatDisplayDate } from '../../utils/formatters';
import ConfirmDialog from '../dialogs/ConfirmDialog';
import AvailabilityView from '../views/instructor/AvailabilityView';
import ScheduledClassesView from '../views/ScheduledClassesView';
import CourseHistoryView from '../../components/views/CourseHistoryView';
import InstructorPortalHeader from '../../components/headers/InstructorPortalHeader';
import logger from '../../utils/logger';
import { tokenService } from '../../services/tokenService';

// Import the missing components
const InstructorDashboard = lazy(() => import('../views/InstructorDashboard'));
const MyClassesView = lazy(() => import('../views/instructor/MyClassesView'));
const AttendanceView = lazy(() => import('../views/instructor/AttendanceView'));
const InstructorArchiveTable = lazy(() => import('../tables/InstructorArchiveTable'));

const drawerWidth = 240;

// Define Ontario 2024 Statutory Holidays (YYYY-MM-DD format)
const ontarioHolidays2024 = new Set([
    '2024-01-01', // New Year's Day
    '2024-02-19', // Family Day
    '2024-03-29', // Good Friday
    '2024-05-20', // Victoria Day
    '2024-07-01', // Canada Day
    '2024-08-05', // Civic Holiday (Not statutory, but often observed)
    '2024-09-02', // Labour Day
    '2024-09-30', // National Day for Truth and Reconciliation (Federal, not Prov. stat but important)
    '2024-10-14', // Thanksgiving Day
    '2024-12-25', // Christmas Day
    '2024-12-26', // Boxing Day
]);
// Note: Easter Sunday (Mar 31) & Remembrance Day (Nov 11) are not statutory holidays in ON.

const InstructorPortal = () => {
    const { isAuthenticated, logout, socket, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get current view from URL path
    const getCurrentView = () => {
        const pathSegments = location.pathname.split('/');
        const viewSegment = pathSegments[pathSegments.length - 1];
        return viewSegment || 'dashboard'; // Default to dashboard
    };

    const [selectedDate, setSelectedDate] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [availableDates, setAvailableDates] = useState(new Set());
    const [scheduledClasses, setScheduledClasses] = useState([]);
    const [courseHistory, setCourseHistory] = useState([]);
    const [archivedCourses, setArchivedCourses] = useState([]);
    const [availableDatesResult, setAvailableDatesResult] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    const [loading, setLoading] = useState(true);
    const [studentsForAttendance, setStudentsForAttendance] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [classToManage, setClassToManage] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoadingArchive, setIsLoadingArchive] = useState(false);
    const [archiveError, setArchiveError] = useState('');
    const [isInitializing, setIsInitializing] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [classToComplete, setClassToComplete] = useState(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const [completedClasses, setCompletedClasses] = useState([]);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const loadInitialData = async () => {
        logger.debug('[InstructorPortal] Starting loadInitialData...');
        try {
            // Verify token availability before making API calls
            const token = tokenService.getAccessToken();
            logger.debug('[InstructorPortal] Token available before API calls:', !!token);
            if (!token) {
                logger.error('[InstructorPortal] No token available, cannot make API calls');
                await logout();
                navigate('/login');
                return;
            }

            logger.debug('[InstructorPortal] Fetching availability...');
            const availabilityResponse = await api.get('/api/v1/instructor/availability');
            logger.debug('[InstructorPortal] Availability response:', availabilityResponse);
            setAvailableDates(new Set(availabilityResponse.data.data.map(avail => avail.date)));

            logger.debug('[InstructorPortal] Fetching scheduled classes...');
            const classesResponse = await api.get('/api/v1/instructor/classes');
            logger.debug('[InstructorPortal] Classes response:', classesResponse);
            setScheduledClasses(classesResponse.data.data || []);

            // Fetch course history
            const historyResponse = await api.get('/api/v1/instructor/classes/completed');
            logger.debug('[InstructorPortal] Setting course history:', historyResponse.data.data);
            setCourseHistory(historyResponse.data.data);

            logger.debug('[InstructorPortal] Data loaded successfully');
            setLoading(false);
        } catch (error) {
            logger.error('[InstructorPortal] Error loading initial data:', error);
            if (error.response?.status === 401) {
                logger.error('[InstructorPortal] 401 Unauthorized - clearing auth and redirecting');
                await logout();
                navigate('/login');
                return;
            }
            setSnackbar({
                open: true,
                message: error.message || 'Failed to load data',
                severity: 'error'
            });
            setLoading(false);
        }
    };

    // Authentication and data loading effect - must be after loadInitialData definition
    useEffect(() => {
        // Prevent multiple initializations
        if (isInitializing) {
            logger.debug('[InstructorPortal] Already initializing, skipping...');
            return;
        }

        // Redirect to login if not authenticated
        if (!isAuthenticated || !user) {
            logger.debug('[InstructorPortal] User not authenticated, redirecting to login');
            navigate('/login');
            return;
        }

        // Add a small delay to ensure token is properly available in API interceptor
        const initializePortal = async () => {
            setIsInitializing(true);
            logger.debug('[InstructorPortal] User authenticated, checking token availability...');
            
            // Verify token is available before proceeding
            const token = tokenService.getAccessToken();
            if (!token) {
                logger.debug('[InstructorPortal] No token available, redirecting to login');
                setIsInitializing(false);
                navigate('/login');
                return;
            }
            
            logger.debug('[InstructorPortal] Token confirmed, loading initial data and setting up socket');
            
            // Increased delay to ensure API interceptor has the token
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Double-check token is still available after delay
            const tokenAfterDelay = tokenService.getAccessToken();
            logger.debug('[InstructorPortal] Token still available after delay:', !!tokenAfterDelay);
            
            await loadInitialData();
            setIsInitializing(false);
        };

        initializePortal();

        // Set up socket listeners only if socket is available
        if (socket && typeof socket.on === 'function') {
            logger.debug('[InstructorPortal] Setting up socket listener for course_assigned');
            socket.on('course_assigned', (data) => {
                logger.debug('[InstructorPortal] Received course_assigned event:', data);
                setScheduledClasses(prev => [...prev, data]);
                setSnackbar({
                    open: true,
                    message: 'New course assigned to you',
                    severity: 'success'
                });
            });
        } else {
            logger.debug('[InstructorPortal] Socket not available, skipping socket listener setup');
        }

        return () => {
            if (socket && typeof socket.off === 'function') {
                logger.debug('[InstructorPortal] Cleaning up socket listener for course_assigned');
                socket.off('course_assigned');
            }
            setIsInitializing(false);
        };
    }, [isAuthenticated, user, socket, navigate]);

    const fetchScheduledClasses = useCallback(async () => {
        try {
            const response = await api.get('/api/v1/instructor/classes');
            setScheduledClasses(response.data.data);
        } catch (error) {
            logger.error('Error fetching scheduled classes:', error);
            if (error.response?.status === 401) {
                await logout();
                navigate('/login');
            }
        }
    }, []);

    const fetchArchivedCourses = useCallback(async () => {
        setIsLoadingArchive(true);
        setArchiveError('');
        try {
            const response = await api.get('/api/v1/instructor/classes/completed');
            if (response.data.success) {
                setCompletedClasses(response.data.data.classes || []);
                setArchivedCourses(response.data.data.classes || []); // For backward compatibility
            } else {
                throw new Error(response.data.message || 'Failed to fetch completed courses');
            }
        } catch (error) {
            logger.error('Error fetching completed courses:', error);
            setArchiveError(error.message || 'Failed to fetch completed courses');
            setCompletedClasses([]);
            setArchivedCourses([]);
        } finally {
            setIsLoadingArchive(false);
        }
    }, []);

    const fetchStudentsForClass = useCallback(async (course_id) => {
        try {
            logger.debug(`[fetchStudentsForClass] Fetching students for course ${course_id}...`);
            const data = await api.get('/api/v1/instructor/classes/students', { params: { course_id } });
            setStudentsForAttendance(data || []);
            logger.debug(`[fetchStudentsForClass] State updated for course ${course_id}:`, data || []);
        } catch (error) {
            logger.error(`[fetchStudentsForClass] Error fetching students for course ${course_id}:`, error);
            showSnackbar('Error fetching students', 'error');
        } finally {
            logger.debug(`[fetchStudentsForClass] Finished for course ${course_id}.`);
        }
    }, [showSnackbar]);

    // Handle view changes based on URL
    useEffect(() => {
        const currentView = getCurrentView();
        logger.debug(`[useEffect View Change] View changed to: ${currentView}`);
        
        // Reset states when view changes
        setStudentsForAttendance([]);
        setClassToManage(null); 

        // Load data specific to the selected view
        if (currentView === 'archive') {
            fetchArchivedCourses();
        } else if (currentView === 'attendance') {
            if (scheduledClasses.length === 1) {
                logger.debug('[useEffect View Change] Auto-selecting the only scheduled class for attendance.');
                setClassToManage(scheduledClasses[0]);
            }
        }
    }, [location.pathname, fetchArchivedCourses, scheduledClasses]);

    useEffect(() => {
        if (classToManage) {
            logger.debug(`[useEffect classToManage] Class to manage selected: ${classToManage.course_id}. Fetching students.`);
            fetchStudentsForClass(classToManage.course_id);
        } else {
            setStudentsForAttendance([]);
        }
    }, [classToManage, fetchStudentsForClass]);

    const handleDateClick = async (date) => {
        const isoDateString = date.toISOString().split('T')[0];
        logger.debug('[handleDateClick] Date clicked (YYYY-MM-DD):', isoDateString);
        
        logger.debug('[handleDateClick] Checking against availableDates Set. Contents:', availableDates);

        const isAvailable = availableDates.has(isoDateString);
        logger.debug('[handleDateClick] Is available in Set?', isAvailable);

        if (isAvailable) {
            setConfirmAction('remove');
            setSelectedDate(isoDateString);
            setShowConfirmDialog(true);
        } else {
            try {
                logger.debug('[handleDateClick] Calling api.addAvailability...');
                const response = await api.post('/api/v1/instructor/availability', { date: isoDateString });
                
                if (response.data.success) {
                    logger.debug('[handleDateClick] api.addAvailability succeeded. Refreshing data...');
                    await loadInitialData(); 
                    showSnackbar('Date marked as available');
                } else {
                    throw new Error(response.data.message || 'API failed to add availability');
                }
            } catch (error) {
                logger.error('Error adding availability:', error);
                showSnackbar(error.message || 'Failed to add availability. Please try again.', 'error');
            }
        }
    };

    const handleManageClassClick = (class_id) => {
        setClassToManage(class_id);
    };

    /**
     * Commercial-grade course completion handler with comprehensive validation and UX
     * @param {Object} classItem - The class item to mark as complete
     */
    const handleMarkCompleteClick = useCallback(async (classItem) => {
        logger.debug('[handleMarkCompleteClick] Class selected for completion:', classItem);
        
        // Pre-validation checks
        if (!classItem || !classItem.course_id) {
            showSnackbar('Invalid class selected', 'error');
            return;
        }

        // Check if class is in the past or today
        const classDate = new Date(classItem.displayDate);
        const today = new Date();
        const isToday = classDate.toDateString() === today.toDateString();
        const isPast = classDate < today.setHours(0, 0, 0, 0);

        if (!isPast && !isToday) {
            showSnackbar('Cannot complete a future class. Please wait until the class date.', 'warning');
            return;
        }

        setClassToComplete(classItem);
        setShowCompleteDialog(true);
    }, [showSnackbar]);

    /**
     * Execute course completion with full transaction handling
     */
    const handleConfirmComplete = useCallback(async () => {
        if (!classToComplete) return;

        setIsCompleting(true);
        
        try {
            logger.info('[handleConfirmComplete] Marking class as complete:', classToComplete.course_id);
            
            const response = await api.put(`/api/v1/instructor/classes/${classToComplete.course_id}/complete`, {
                generateCertificates: false // Future enhancement
            });

            if (response.data.success) {
                // Show success message with completion details
                const completionData = response.data.data;
                showSnackbar(
                    `Class completed successfully! ${completionData.students_attended} students attended.`, 
                    'success'
                );

                // Refresh data to reflect changes
                await Promise.all([
                    loadInitialData(), // Refresh current classes
                    fetchArchivedCourses() // Refresh archive
                ]);

                logger.info('[handleConfirmComplete] Class completion successful');
            } else {
                throw new Error(response.data.message || 'Failed to complete class');
            }

        } catch (error) {
            logger.error('[handleConfirmComplete] Error completing class:', error);
            
            // Handle specific error cases with user-friendly messages
            if (error.response?.status === 400) {
                const errorMessage = error.response.data.message || 'Invalid request';
                if (errorMessage.includes('attendance')) {
                    showSnackbar(
                        'Please mark attendance for all students before completing the class.', 
                        'warning'
                    );
                } else if (errorMessage.includes('future')) {
                    showSnackbar('Cannot complete a future class.', 'warning');
                } else {
                    showSnackbar(errorMessage, 'error');
                }
            } else if (error.response?.status === 404) {
                showSnackbar('Class not found or access denied.', 'error');
            } else if (error.response?.status === 409) {
                showSnackbar('Class is already marked as completed.', 'info');
            } else {
                showSnackbar(
                    error.response?.data?.message || 'Failed to complete class. Please try again.', 
                    'error'
                );
            }
        } finally {
            setIsCompleting(false);
            setShowCompleteDialog(false);
            setClassToComplete(null);
        }
    }, [classToComplete, showSnackbar, loadInitialData, fetchArchivedCourses]);

    const handleAttendanceClick = (class_id) => {
        logger.debug(`[handleAttendanceClick] Class ID: ${class_id}`);
        setClassToManage(class_id);
    };

    const handleClassChange = (event) => {
        const class_id = event.target.value;
        const selectedClass = scheduledClasses.find(c => c.course_id === class_id);
        setClassToManage(selectedClass);
        if (selectedClass) {
            fetchStudentsForClass(selectedClass.course_id);
        }
    };

    const handleConfirmAction = async () => {
        if (!selectedDate) return;
        
        try {
            if (confirmAction === 'remove') {
                const response = await api.delete('/api/v1/instructor/availability', { data: { date: selectedDate } });
                setAvailableDates(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(selectedDate);
                    return newSet;
                });
                showSnackbar('Availability removed successfully');
            }
        } catch (error) {
            logger.error('Error handling availability:', error);
            showSnackbar(error.message || 'Failed to update availability', 'error');
        } finally {
            setShowConfirmDialog(false);
            setSelectedDate(null);
            setConfirmAction(null);
        }
    };

    const handlePreviousMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAttendanceChange = async (student_id, currentAttendance) => {
        if (!classToManage) return;
        
        try {
            const newAttendance = !currentAttendance; // Toggle boolean value
            const response = await api.post('/api/v1/instructor/classes/students/attendance', { student_id, attendance: newAttendance });
            
            setStudentsForAttendance(prev => 
                prev.map(student => 
                    student.student_id === student_id 
                        ? { ...student, attendance: newAttendance }
                        : student
                )
            );
            
            // Refresh scheduled classes to update the attendance count
            await fetchScheduledClasses();
            
            showSnackbar('Attendance updated successfully');
        } catch (error) {
            logger.error('Error updating attendance:', error);
            showSnackbar(error.message || 'Failed to update attendance', 'error');
        }
    };

    const combinedItems = useMemo(() => {
        logger.debug('[useMemo] Recalculating combinedItems...');
        const classesToDisplay = Array.isArray(scheduledClasses) ? scheduledClasses : [];
        const currentAvailableDatesSet = (availableDates instanceof Set) ? availableDates : new Set(); 
        const availabilityDatesArray = Array.from(currentAvailableDatesSet);

        const combined = [
            ...classesToDisplay.map(course => {
                const scheduledIsoDate = course.datescheduled ? new Date(course.datescheduled).toISOString().split('T')[0] : null;
                return {
                    ...course,
                    type: 'class',
                    sortDate: new Date(course.datescheduled || 0), 
                    displayDate: formatDisplayDate(scheduledIsoDate),
                    key: `class-${course.course_id}`,
                    status: course.completed ? 'Completed' : 'Scheduled',
                    organizationname: course.organizationname || '-',
                    coursetypename: course.coursetypename || '-',
                    location: course.location || '-',
                    studentcount: course.studentcount || 0
                };
            }),
            ...availabilityDatesArray.map(dateString => { 
                const displayDate = formatDisplayDate(dateString);
                return {
                    type: 'availability',
                    sortDate: new Date(dateString), 
                    displayDate: displayDate,
                    dateString: dateString,
                    key: `avail-${dateString}`,
                    status: 'AVAILABLE',
                    organizationname: '-',
                    coursetypename: '-',
                    location: '-',
                    studentcount: '-'
                };
            })
        ];
        combined.sort((a, b) => a.sortDate - b.sortDate);
        return combined;
    }, [scheduledClasses, availableDates]);

    // Navigation helper function
    const handleViewChange = (view) => {
        navigate(`/instructor/${view}`);
    };

    // Get current view for highlighting navigation
    const currentView = getCurrentView();

    logger.debug('[InstructorPortal Render] Snackbar state:', snackbar);

    return (
        <>
            <Box sx={{ display: 'flex' }}>
                {/* --- AppBar --- */}
                <AppBar
                    position="fixed"
                    sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} 
                >
                    <Toolbar>
                        {/* You can add a logo here if desired */}
                        {/* <img src="/path/to/logo.svg" alt="Logo" height="40" /> */}
                        <Typography 
                            variant="h6" 
                            noWrap 
                            component="div" 
                            sx={{ 
                                flexGrow: 1, 
                                ml: 1, 
                                textAlign: 'center'
                            }}
                        >
                            🏥 Instructor Portal
                        </Typography>
                        <Typography variant="body1" noWrap sx={{ mr: 2 }}>
                            Welcome {user?.username || user?.first_name || 'Instructor'}!
                        </Typography>
                        {/* Optional: Add a logout button here as well/instead */}
                        {/* <Button color="inherit" onClick={handleLogout}>Logout</Button> */}
                    </Toolbar>
                </AppBar>
                
                {/* --- Drawer --- */}
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
                                selected={currentView === 'dashboard'}
                                onClick={() => handleViewChange('dashboard')}
                                sx={{
                                    cursor: 'pointer', 
                                    py: 1.5, 
                                    backgroundColor: currentView === 'dashboard' ? 'primary.light' : 'transparent',
                                    color: currentView === 'dashboard' ? 'primary.contrastText' : 'inherit',
                                    '& .MuiListItemIcon-root': {
                                        color: currentView === 'dashboard' ? 'primary.contrastText' : 'inherit',
                                    },
                                    '&:hover': {
                                        backgroundColor: currentView === 'dashboard' ? 'primary.main' : 'action.hover',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit' }}>
                                    <DashboardIcon />
                                </ListItemIcon>
                                <ListItemText primary="Dashboard" />
                            </ListItem>
                            <ListItem 
                                component="div"
                                selected={currentView === 'availability'}
                                onClick={() => handleViewChange('availability')}
                                sx={{
                                    cursor: 'pointer', 
                                    py: 1.5, 
                                    backgroundColor: currentView === 'availability' ? 'primary.light' : 'transparent',
                                    color: currentView === 'availability' ? 'primary.contrastText' : 'inherit',
                                    '& .MuiListItemIcon-root': {
                                        color: currentView === 'availability' ? 'primary.contrastText' : 'inherit',
                                    },
                                    '&:hover': {
                                        backgroundColor: currentView === 'availability' ? 'primary.main' : 'action.hover',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit' }}>
                                    <CalendarIcon />
                                </ListItemIcon>
                                <ListItemText primary="Schedule Availability" />
                            </ListItem>
                            <ListItem 
                                component="div"
                                selected={currentView === 'classes'}
                                onClick={() => handleViewChange('classes')}
                                sx={{
                                    cursor: 'pointer', 
                                    py: 1.5, 
                                    backgroundColor: currentView === 'classes' ? 'primary.light' : 'transparent',
                                    color: currentView === 'classes' ? 'primary.contrastText' : 'inherit',
                                    '& .MuiListItemIcon-root': {
                                        color: currentView === 'classes' ? 'primary.contrastText' : 'inherit',
                                    },
                                    '&:hover': {
                                        backgroundColor: currentView === 'classes' ? 'primary.main' : 'action.hover',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit' }}>
                                    <ClassIcon />
                                </ListItemIcon>
                                <ListItemText primary="My Classes" />
                            </ListItem>
                            <ListItem 
                                component="div"
                                selected={currentView === 'attendance'}
                                onClick={() => handleViewChange('attendance')}
                                sx={{
                                    cursor: 'pointer', 
                                    py: 1.5, 
                                    backgroundColor: currentView === 'attendance' ? 'primary.light' : 'transparent',
                                    color: currentView === 'attendance' ? 'primary.contrastText' : 'inherit',
                                    '& .MuiListItemIcon-root': {
                                        color: currentView === 'attendance' ? 'primary.contrastText' : 'inherit',
                                    },
                                    '&:hover': {
                                        backgroundColor: currentView === 'attendance' ? 'primary.main' : 'action.hover',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit' }}>
                                    <AttendanceIcon />
                                </ListItemIcon>
                                <ListItemText primary="Attendance" />
                            </ListItem>
                            <ListItem 
                                component="div"
                                selected={currentView === 'archive'}
                                onClick={() => handleViewChange('archive')}
                                sx={{
                                    cursor: 'pointer', 
                                    py: 1.5, 
                                    backgroundColor: currentView === 'archive' ? 'primary.light' : 'transparent',
                                    color: currentView === 'archive' ? 'primary.contrastText' : 'inherit',
                                    '& .MuiListItemIcon-root': {
                                        color: currentView === 'archive' ? 'primary.contrastText' : 'inherit',
                                    },
                                    '&:hover': {
                                        backgroundColor: currentView === 'archive' ? 'primary.main' : 'action.hover',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit' }}>
                                    <ArchiveIcon />
                                </ListItemIcon>
                                <ListItemText primary="Archive" />
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
                                <ListItemIcon>
                                    <LogoutIcon />
                                </ListItemIcon>
                                <ListItemText primary="Logout" />
                            </ListItem>
                        </List>
                    </Box>
                </Drawer>

                {/* --- Main Content Area --- */}
                <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    {/* Toolbar spacer to push content below AppBar */}
                    <Toolbar />
                    <Container maxWidth="lg">
                        {loading ? (
                            <Typography>Loading data...</Typography>
                        ) : (
                            <>
                                {/* Use Suspense to wrap the view rendering */}
                                <Suspense fallback={
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                                        <CircularProgress />
                                    </Box>
                                }>
                                    <Routes>
                                        <Route path="/" element={<InstructorDashboard />} />
                                        <Route path="/dashboard" element={<InstructorDashboard />} />
                                        <Route path="/availability" element={
                                            <AvailabilityView
                                                availableDates={Array.from(availableDates)}
                                                scheduledClasses={scheduledClasses}
                                                ontarioHolidays2024={[]}
                                                handleDateClick={handleDateClick}
                                                currentDate={currentDate}
                                                handlePreviousMonth={handlePreviousMonth}
                                                handleNextMonth={handleNextMonth}
                                            />
                                        } />
                                        <Route path="/classes" element={
                                            <MyClassesView
                                                combinedItems={combinedItems}
                                                onAttendanceClick={handleAttendanceClick}
                                                onMarkCompleteClick={handleMarkCompleteClick}
                                            />
                                        } />
                                        <Route path="/attendance" element={
                                            <AttendanceView onAttendanceUpdate={fetchScheduledClasses} />
                                        } />
                                        <Route path="/archive" element={
                                            <>
                                                {isLoadingArchive ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                                                        <CircularProgress />
                                                        <Typography sx={{ ml: 2 }}>Loading completed classes...</Typography>
                                                    </Box>
                                                ) : archiveError ? (
                                                    <Box sx={{ p: 3 }}>
                                                        <Alert severity="error" sx={{ mb: 2 }}>
                                                            <Typography variant="h6">Error Loading Archive</Typography>
                                                            <Typography>{archiveError}</Typography>
                                                        </Alert>
                                                        <Button 
                                                            variant="outlined" 
                                                            onClick={fetchArchivedCourses}
                                                            startIcon={<ClassIcon />}
                                                        >
                                                            Retry Loading
                                                        </Button>
                                                    </Box>
                                                ) : (
                                                    <InstructorArchiveTable courses={completedClasses} />
                                                )}
                                            </>
                                        } />
                                    </Routes>
                                </Suspense>
                            </>
                        )}
                    </Container>
                </Box>

                <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
                    <DialogTitle>Confirm Action</DialogTitle>
                    <DialogContent>
                        Are you sure you want to remove this date from your availability?
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                        <Button onClick={handleConfirmAction} color="primary">
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Course Completion Confirmation Dialog */}
                <Dialog 
                    open={showCompleteDialog} 
                    onClose={() => !isCompleting && setShowCompleteDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon color="warning" />
                        Confirm Course Completion
                    </DialogTitle>
                    <DialogContent>
                        {classToComplete && (
                            <Box sx={{ py: 1 }}>
                                <Typography variant="body1" gutterBottom>
                                    Are you sure you want to mark this class as <strong>completed</strong>?
                                </Typography>
                                
                                <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
                                    <Typography variant="h6" gutterBottom>
                                        Class Details:
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Date:</strong> {classToComplete.displayDate}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Course:</strong> {classToComplete.coursetypename}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Organization:</strong> {classToComplete.organizationname}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Students:</strong> {classToComplete.studentsattendance} attended
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Location:</strong> {classToComplete.location}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                <Alert severity="info" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        <strong>This action will:</strong>
                                    </Typography>
                                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                        <li>Remove the class from your "My Classes" view</li>
                                        <li>Move the class to your "Archive" section</li>
                                        <li>Mark the course as completed in the system</li>
                                        <li>Cannot be undone once completed</li>
                                    </ul>
                                </Alert>

                                <Alert severity="warning" sx={{ mt: 1 }}>
                                    <Typography variant="body2">
                                        Please ensure all student attendance has been marked before completing.
                                    </Typography>
                                </Alert>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button 
                            onClick={() => setShowCompleteDialog(false)} 
                            disabled={isCompleting}
                            color="inherit"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleConfirmComplete} 
                            color="success"
                            variant="contained"
                            disabled={isCompleting}
                            startIcon={isCompleting ? <CircularProgress size={16} /> : <SuccessIcon />}
                            sx={{ minWidth: 140 }}
                        >
                            {isCompleting ? 'Completing...' : 'Mark Complete'}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Paper elevation={6} sx={{ padding: '6px 16px', bgcolor: snackbar.severity === 'success' ? 'lightgreen' : 'pink' }}>
                        <Typography>{snackbar.message}</Typography>
                    </Paper>
                </Snackbar>
            </Box>
        </>
    );
};

export default InstructorPortal; 