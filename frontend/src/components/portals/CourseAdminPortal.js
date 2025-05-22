import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
    Select, MenuItem, FormControl, InputLabel,
    TextField,
    Button,
    TableSortLabel,
    AppBar,
    Toolbar
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon, // For Instructor Dashboard
    PendingActions as PendingActionsIcon, // For Pending Courses
    EventAvailable as EventAvailableIcon, // For Scheduled Courses
    AssignmentTurnedIn as CompletedIcon, // Icon for Completed
    Assessment as ReportsIcon, // Add Reports icon
    Logout as LogoutIcon,
    VpnKey as PasswordIcon,
} from '@mui/icons-material';
import * as api from '../../services/api';
import InstructorDashboardTable from '../tables/InstructorDashboardTable';
import PendingCoursesTable from '../tables/PendingCoursesTable';
import ScheduledCoursesTable from '../tables/ScheduledCoursesTable';
import CompletedCoursesTable from '../tables/CompletedCoursesTable';
import InstructorWorkloadSummaryTable from '../tables/InstructorWorkloadSummaryTable';
import ViewStudentsDialog from '../dialogs/ViewStudentsDialog';
import ScheduleCourseDialog from '../dialogs/ScheduleCourseDialog';
import CancelCourseDialog from '../dialogs/CancelCourseDialog';
import AdminReportsView from '../../components/views/AdminReportsView';
import logger from '../../utils/logger';

const drawerWidth = 240;

const CourseAdminPortal = () => {
    const { user, logout, socket } = useAuth();
    const navigate = useNavigate();
    const [selected_view, setSelectedView] = useState('instructors');
    const [instructor_data, setInstructorData] = useState([]);
    const [is_loading_instructors, setIsLoadingInstructors] = useState(false);
    const [instructors_error, setInstructorsError] = useState('');
    const [instructor_workloads, setInstructorWorkloads] = useState([]);
    const [is_loading_workload, setIsLoadingWorkload] = useState(false);
    const [workload_error, setWorkloadError] = useState('');
    const [pending_courses, setPendingCourses] = useState([]);
    const [is_loading_pending, setIsLoadingPending] = useState(false);
    const [pending_error, setPendingError] = useState('');
    const [scheduled_courses, setScheduledCourses] = useState([]);
    const [is_loading_scheduled, setIsLoadingScheduled] = useState(false);
    const [scheduled_error, setScheduledError] = useState('');
    const [completed_courses, setCompletedCourses] = useState([]);
    const [is_loading_completed, setIsLoadingCompleted] = useState(false);
    const [completed_error, setCompletedError] = useState('');
    const [show_view_students_dialog, setShowViewStudentsDialog] = useState(false);
    const [selected_course_for_view, setSelectedCourseForView] = useState(null);
    const [show_schedule_dialog, setShowScheduleDialog] = useState(false);
    const [selected_course_for_schedule, setSelectedCourseForSchedule] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [all_instructors, setAllInstructors] = useState([]);
    const [selected_instructor_filter, setSelectedInstructorFilter] = useState('');
    const [selected_date_filter, setSelectedDateFilter] = useState('');
    const [pending_date_filter, setPendingDateFilter] = useState('');
    const [scheduled_instructor_filter, setScheduledInstructorFilter] = useState('');
    const [scheduled_date_filter, setScheduledDateFilter] = useState('');
    const [instructor_sort_order, setInstructorSortOrder] = useState('asc');
    const [instructor_sort_by, setInstructorSortBy] = useState('date');
    const [completed_sort_order, setCompletedSortOrder] = useState('desc');
    const [completed_sort_by, setCompletedSortBy] = useState('date');
    const [org_courses_sort_order, setOrgCoursesSortOrder] = useState('asc');
    const [org_courses_sort_by, setOrgCoursesSortBy] = useState('date_requested');
    // State for Cancel Dialog
    const [show_cancel_dialog, setShowCancelDialog] = useState(false);
    const [course_to_cancel, setCourseToCancel] = useState(null); // Store {id, number}

    // --- useCallback wrapped functions FIRST ---
    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const handleLogout = () => {
        // Add Snackbar message
        const first_name = user?.first_name || 'Admin'; 
        const logout_message = `Goodbye ${first_name}, Have a Productive Day!`;
        showSnackbar(logout_message, 'info');

        setTimeout(() => {
            logout();
            navigate('/');
        }, 1500); 
    };

    const loadInstructorViewData = useCallback(async () => {
        // Load main dashboard data
        setIsLoadingInstructors(true);
        setInstructorsError('');
        logger.info('[loadInstructorViewData] Fetching main dashboard data...'); 
        const dashboard_promise = api.getInstructorDashboard()
            .then(data => {
                logger.info('[loadInstructorViewData] Main dashboard API Response:', data);
                setInstructorData(data);
            })
            .catch(err => {
                logger.error('Error loading instructor dashboard:', err);
                const error_msg = err.message || 'Failed to load instructor data.';
                setInstructorsError(error_msg);
                setInstructorData([]);
            })
            .finally(() => setIsLoadingInstructors(false));

        // Load workload summary data
        setIsLoadingWorkload(true);
        setWorkloadError('');
        logger.info('[loadInstructorViewData] Fetching workload summary...');
        const workload_promise = api.getInstructorWorkloads()
            .then(data => {
                logger.info('[loadInstructorViewData] Workload API Response:', data);
                setInstructorWorkloads(data || []);
            })
            .catch(err => {
                logger.error('Error loading instructor workload:', err);
                const error_msg = err.message || 'Failed to load workload summary.';
                setWorkloadError(error_msg);
                setInstructorWorkloads([]);
            })
            .finally(() => setIsLoadingWorkload(false));
        
        // Wait for both fetches to complete (optional, could render parts as they load)
        await Promise.all([dashboard_promise, workload_promise]);
        logger.info('[loadInstructorViewData] Finished loading all data for instructor view.');

    }, []);

    const loadPendingCourses = useCallback(async () => {
        setIsLoadingPending(true);
        setPendingError('');
        logger.info('[loadPendingCourses] Fetching...'); // Log start
        try {
            const data = await api.getPendingCourses();
            logger.info('[loadPendingCourses] API Response:', data);
            setPendingCourses(data);
            logger.info('[loadPendingCourses] State updated:', data);
        } catch (err) {
            logger.error('Error loading pending courses:', err);
            const error_msg = err.message || 'Failed to load pending courses.';
            setPendingError(error_msg);
            logger.info('[loadPendingCourses] Error state set:', error_msg);
            setPendingCourses([]);
        } finally {
            setIsLoadingPending(false);
            logger.info('[loadPendingCourses] Finished.');
        }
    }, []);

    const loadScheduledCourses = useCallback(async () => {
        setIsLoadingScheduled(true);
        setScheduledError('');
        logger.info('[loadScheduledCourses] Fetching...'); // Log start
        try {
            const data = await api.getScheduledCoursesAdmin();
            logger.info('[loadScheduledCourses] API Response:', data);
            setScheduledCourses(data || []); // Ensure it's an array
            logger.info('[loadScheduledCourses] State updated:', data || []);
        } catch (err) {
            logger.error('Error loading scheduled courses:', err);
            const error_msg = err.message || 'Failed to load scheduled courses.';
            setScheduledError(error_msg);
            logger.info('[loadScheduledCourses] Error state set:', error_msg);
            setScheduledCourses([]);
        } finally {
            setIsLoadingScheduled(false);
            logger.info('[loadScheduledCourses] Finished.');
        }
    }, []);

    const loadCompletedCourses = useCallback(async () => {
        setIsLoadingCompleted(true);
        setCompletedError('');
        logger.info('[loadCompletedCourses] Fetching...'); // Log start
        try {
            const data = await api.getCompletedCoursesAdmin();
            logger.info('[loadCompletedCourses] API Response:', data);
            setCompletedCourses(data || []); // Ensure it's an array
            logger.info('[loadCompletedCourses] State updated:', data || []);
        } catch (err) {
            logger.error('Error loading completed courses:', err);
            const error_msg = err.message || 'Failed to load completed courses.';
            setCompletedError(error_msg);
            logger.info('[loadCompletedCourses] Error state set:', error_msg);
            setCompletedCourses([]);
        } finally {
            setIsLoadingCompleted(false);
            logger.info('[loadCompletedCourses] Finished.');
        }
    }, []);

    const loadAllInstructors = useCallback(async () => {
        try {
            const data = await api.getAllInstructors();
            setAllInstructors(data || []);
        } catch (err) {
            logger.error('Error loading instructors for filter:', err);
            setAllInstructors([]);
        }
    }, []);

    const loadWorkloadSummary = useCallback(async () => {
        setIsLoadingWorkload(true);
        setWorkloadError('');
        logger.info('[loadWorkloadSummary] Fetching workload summary...');
        try {
            const data = await api.getInstructorWorkloads();
            logger.info('[loadWorkloadSummary] Workload API Response:', data);
            setInstructorWorkloads(data || []);
        } catch (err) {
            logger.error('Error loading instructor workload:', err);
            const error_msg = err.message || 'Failed to load workload summary.';
            setWorkloadError(error_msg);
            setInstructorWorkloads([]);
        } finally {
            setIsLoadingWorkload(false);
        }
    }, []);

    // --- useEffect hooks NEXT ---
    useEffect(() => {
        loadAllInstructors();
    }, [loadAllInstructors]);

    // Main useEffect to load data based on selected view
    useEffect(() => {
        if (selected_view === 'instructors') {
            logger.info('[useEffect] Loading ALL instructor view data...');
            loadInstructorViewData();
        } else if (selected_view === 'pending') {
            logger.info('[useEffect] Loading pending courses AND workload summary...');
            loadPendingCourses();
            loadWorkloadSummary();
        } else if (selected_view === 'scheduled') {
            logger.info('[useEffect] Loading scheduled courses...');
            loadScheduledCourses();
        } else if (selected_view === 'completed') {
            logger.info('[useEffect] Loading completed courses...');
            loadCompletedCourses();
        }
    }, [selected_view, loadInstructorViewData, loadPendingCourses, loadScheduledCourses, loadCompletedCourses, loadWorkloadSummary]);

    useEffect(() => {
        if (!socket) return; // Don't run if socket isn't ready

        logger.info('[AdminPortal] Setting up socket listener for attendance_updated');
        
        const handleAttendanceUpdate = ({ course_id, new_attendance_count }) => {
            logger.info(`[handleAttendanceUpdate] Event received. CourseID: ${course_id} (Type: ${typeof course_id}), New Count: ${new_attendance_count} (Type: ${typeof new_attendance_count}). Updating state...`);
            
            // Update state for all relevant course lists using the correct lowercase key 'students_attendance'
            let nextScheduledCoursesState;
            setScheduledCourses(prev => {
                logger.info('[setScheduledCourses updater] Value of prev state:', prev);
                nextScheduledCoursesState = prev.map(course => 
                   course.course_id === course_id ? { ...course, students_attendance: new_attendance_count } : course
                );
                logger.info('[handleAttendanceUpdate] Calculated next scheduledCourses state:', nextScheduledCoursesState);
                return nextScheduledCoursesState; 
            });

            setInstructorData(prev => prev.map(item => 
                item.id === `course-${course_id}` ? { ...item, students_attendance: new_attendance_count } : item
            ));
            setCompletedCourses(prev => prev.map(course => 
                course.course_id === course_id ? { ...course, students_attendance: new_attendance_count } : course
            ));
            // No need to update pending courses as they shouldn't have attendance yet

            showSnackbar(`Attendance updated for course ${course_id}`, 'info');
        };

        socket.on('attendance_updated', handleAttendanceUpdate);

        // Cleanup listener
        return () => {
            logger.info('[AdminPortal] Cleaning up socket listener for attendance_updated');
            socket.off('attendance_updated', handleAttendanceUpdate);
        };

    }, [socket, showSnackbar]);

    const handleScheduleCourseClick = (course) => {
        logger.info("Schedule course clicked:", course);
        setSelectedCourseForSchedule(course);
        setShowScheduleDialog(true);
    };

    const handleScheduleDialogClose = () => {
        setShowScheduleDialog(false);
        setSelectedCourseForSchedule(null);
    };

    const handleCourseSuccessfullyScheduled = (updated_course) => {
        logger.info("Course scheduled successfully in portal:", updated_course);
        setSnackbar({ open: true, message: 'Course scheduled successfully!', severity: 'success' });
        loadPendingCourses();
        loadScheduledCourses();
    };

    const handleViewStudentsClick = (course_id) => {
        logger.info("[AdminPortal] handleViewStudentsClick CALLED with courseId:", course_id);
        setSelectedCourseForView(course_id);
        setShowViewStudentsDialog(true);
    };

    const handleViewStudentsDialogClose = () => {
        setShowViewStudentsDialog(false);
        setSelectedCourseForView(null);
    };

    const handleBillClick = async (course_id) => {
        logger.info("Marking course ready for billing:", course_id);
        // Consider adding a confirmation dialog here?
        try {
            const response = await api.markCourseReadyForBilling(course_id);
            if (response.success) {
                setSnackbar({ open: true, message: response.message || 'Course marked ready for billing!', severity: 'success' });
                // Refresh the completed courses list (the course should disappear)
                loadCompletedCourses(); 
            } else {
                setSnackbar({ open: true, message: response.message || 'Failed to mark course.', severity: 'error' });
            }
        } catch (err) {
            logger.error("Error marking course for billing:", err);
            setSnackbar({ open: true, message: err.message || 'An error occurred.', severity: 'error' });
        }
    };

    // Open Cancel Dialog
    const handleCancelClick = (course_id, course_number) => {
        logger.info(`[AdminPortal] Cancel clicked for Course ID: ${course_id}, Number: ${course_number}`);
        setCourseToCancel({ course_id, course_number });
        setShowCancelDialog(true);
    };

    // Close Cancel Dialog
    const handleCancelDialogClose = () => {
        setShowCancelDialog(false);
        setCourseToCancel(null);
    };

    // Confirm Cancellation Action
    const handleConfirmCancel = async () => {
        if (!course_to_cancel) return;
        
        try {
            await api.cancelCourse(course_to_cancel.course_id);
            showSnackbar(`Course ${course_to_cancel.course_number} cancelled successfully`);
            loadScheduledCourses();
        } catch (error) {
            logger.error('Error cancelling course:', error);
            showSnackbar(error.message || 'Failed to cancel course', 'error');
        } finally {
            setShowCancelDialog(false);
            setCourseToCancel(null);
        }
    };

    const handleInstructorFilterChange = (event) => {
        setSelectedInstructorFilter(event.target.value);
    };

    const handleDateFilterChange = (event) => {
        setSelectedDateFilter(event.target.value);
    };

    const handlePendingDateFilterChange = (event) => {
        setPendingDateFilter(event.target.value);
    };

    const handleScheduledInstructorFilterChange = (event) => {
        setScheduledInstructorFilter(event.target.value);
    };

    const handleScheduledDateFilterChange = (event) => {
        setScheduledDateFilter(event.target.value);
    };

    const handleInstructorSortRequest = (property) => {
        const is_asc = instructor_sort_by === property && instructor_sort_order === 'asc';
        setInstructorSortOrder(is_asc ? 'desc' : 'asc');
        setInstructorSortBy(property);
    };

    const handleCompletedSortRequest = (property) => {
        const is_asc = completed_sort_by === property && completed_sort_order === 'asc';
        setCompletedSortOrder(is_asc ? 'desc' : 'asc');
        setCompletedSortBy(property);
    };

    const renderSelectedView = () => {
        logger.info(`[renderSelectedView] Rendering view: ${selected_view}`);
        switch (selected_view) {
            case 'dashboard':
                return <Typography variant="h5">Admin Dashboard (Placeholder)</Typography>;
            case 'instructors': {
                const filtered_instructor_data = instructor_data.filter(item => {
                    const instructor_match = !selected_instructor_filter || item.instructor_name === selected_instructor_filter;
                    const item_date_str = item.date ? new Date(item.date).toISOString().split('T')[0] : null;
                    const date_match = !selected_date_filter || item_date_str === selected_date_filter;
                    return instructor_match && date_match;
                });

                filtered_instructor_data.sort((a, b) => {
                    let compare_a, compare_b;
                    if (instructor_sort_by === 'date') {
                        compare_a = new Date(a.date || 0);
                        compare_b = new Date(b.date || 0);
                    } else if (instructor_sort_by === 'status') {
                        compare_a = a.status || '';
                        compare_b = b.status || '';
                    } else {
                        compare_a = a.instructor_name || '';
                        compare_b = b.instructor_name || '';
                    }
                    
                    if (compare_b < compare_a) {
                        return (instructor_sort_order === 'asc' ? 1 : -1);
                    }
                    if (compare_b > compare_a) {
                        return (instructor_sort_order === 'asc' ? -1 : 1);
                    }
                    return 0;
                });
                
                logger.info(`[renderSelectedView: instructors] State: isLoading=${is_loading_instructors}, error=${instructors_error}, ALL_DATA_LEN=${instructor_data.length}, SORTED_FILTERED_DATA_LEN=${filtered_instructor_data.length}`);
                logger.info(`[renderSelectedView: instructors] Workload State: isLoading=${is_loading_workload}, error=${workload_error}, DATA_LEN=${instructor_workloads.length}`);

                return (
                    <>
                        {/* Render Workload Summary Table */}
                        {is_loading_workload ? (
                            <CircularProgress />
                        ) : workload_error ? (
                            <Alert severity="error">{workload_error}</Alert>
                        ) : (
                            <InstructorWorkloadSummaryTable workloads={instructor_workloads} />
                        )}

                        {/* Existing Filters and Instructor Dashboard Table */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel id="instructor-filter-label">Filter by Instructor</InputLabel>
                                <Select
                                    labelId="instructor-filter-label"
                                    value={selected_instructor_filter}
                                    label="Filter by Instructor"
                                    onChange={handleInstructorFilterChange}
                                >
                                    <MenuItem value=""><em>All Instructors</em></MenuItem>
                                    {all_instructors.map((inst) => (
                                        <MenuItem key={inst.instructor_id} value={`${inst.first_name} ${inst.last_name}`}>
                                            {`${inst.last_name}, ${inst.first_name}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField 
                                label="Filter by Date"
                                type="date"
                                size="small"
                                value={selected_date_filter}
                                onChange={handleDateFilterChange}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 180 }}
                            />
                            <Button 
                                size="small" 
                                onClick={() => {setSelectedInstructorFilter(''); setSelectedDateFilter('');}}
                                disabled={!selected_instructor_filter && !selected_date_filter}
                            >
                                Clear Filters
                            </Button>
                        </Box>

                        {is_loading_instructors ? (
                            <CircularProgress />
                        ) : instructors_error ? (
                            <Alert severity="error">{instructors_error}</Alert>
                        ) : (
                            <InstructorDashboardTable 
                                data={filtered_instructor_data} 
                                sortOrder={instructor_sort_order}
                                sortBy={instructor_sort_by}
                                onSortRequest={handleInstructorSortRequest} 
                            />
                        )}
                    </>
                );
            }
            case 'pending': {
                // Apply date filter
                const filtered_pending_courses = pending_courses.filter(course => {
                    // Format course DateRequested to YYYY-MM-DD for comparison
                    const course_date_str = course.date_requested ? new Date(course.date_requested).toISOString().split('T')[0] : null;
                    return !pending_date_filter || course_date_str === pending_date_filter;
                });

                logger.info(`[renderSelectedView: pending] State: isLoading=${is_loading_pending}, error=${pending_error}, ALL_COURSES_LEN=${pending_courses.length}, FILTERED_COURSES_LEN=${filtered_pending_courses.length}`);
                logger.info(`[renderSelectedView: pending] Workload State: isLoading=${is_loading_workload}, error=${workload_error}, DATA_LEN=${instructor_workloads.length}`);

                return (
                    <>
                        {/* Render Workload Summary Table First */}
                        {is_loading_workload ? (
                            <CircularProgress />
                        ) : workload_error ? (
                            <Alert severity="error" sx={{ mb: 2 }}>{`Workload Summary Error: ${workload_error}`}</Alert>
                        ) : (
                            <InstructorWorkloadSummaryTable workloads={instructor_workloads} />
                        )}

                        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Pending Course Requests</Typography> {/* Add title for clarity */}

                        {/* Filter UI */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                            <TextField 
                                label="Filter by Date Requested"
                                type="date"
                                size="small"
                                value={pending_date_filter}
                                onChange={handlePendingDateFilterChange}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 180 }}
                            />
                             <Button 
                                size="small" 
                                onClick={() => setPendingDateFilter('')}
                                disabled={!pending_date_filter}
                            >
                                Clear Date Filter
                            </Button>
                        </Box>

                        {/* Loading / Error / Table Display */}
                        {is_loading_pending ? (
                            <CircularProgress />
                        ) : pending_error ? (
                            <Alert severity="error">{pending_error}</Alert>
                        ) : (
                            <PendingCoursesTable 
                                courses={filtered_pending_courses} 
                                onScheduleClick={handleScheduleCourseClick} 
                                onViewStudentsClick={handleViewStudentsClick}
                                onCancelClick={handleCancelClick}
                            />
                        )}
                    </>
                );
            }
            case 'scheduled': {
                // Apply instructor and date filters
                const filtered_scheduled_courses = scheduled_courses.filter(course => {
                    const instructor_match = !scheduled_instructor_filter || course.instructor_name === scheduled_instructor_filter;
                    // Format course DateScheduled to YYYY-MM-DD
                    const course_date_str = course.date_scheduled ? new Date(course.date_scheduled).toISOString().split('T')[0] : null;
                    const date_match = !scheduled_date_filter || course_date_str === scheduled_date_filter;
                    return instructor_match && date_match;
                });

                logger.info(`[renderSelectedView: scheduled] State: isLoading=${is_loading_scheduled}, error=${scheduled_error}, ALL_COURSES_LEN=${scheduled_courses.length}, FILTERED_COURSES_LEN=${filtered_scheduled_courses.length}`);
                
                return (
                    <>
                         {/* Filter UI - Similar to Instructor Dashboard */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel id="scheduled-instructor-filter-label">Filter by Instructor</InputLabel>
                                <Select
                                    labelId="scheduled-instructor-filter-label"
                                    value={scheduled_instructor_filter}
                                    label="Filter by Instructor"
                                    onChange={handleScheduledInstructorFilterChange}
                                >
                                    <MenuItem value=""><em>All Instructors</em></MenuItem>
                                    {all_instructors.map((inst) => (
                                        // Use full name for consistency, might need adjustment if instructor_name format differs
                                        <MenuItem key={inst.instructor_id} value={`${inst.first_name} ${inst.last_name}`}>
                                            {`${inst.last_name}, ${inst.first_name}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField 
                                label="Filter by Date Scheduled"
                                type="date"
                                size="small"
                                value={scheduled_date_filter}
                                onChange={handleScheduledDateFilterChange}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 180 }}
                            />
                             <Button 
                                size="small" 
                                onClick={() => {setScheduledInstructorFilter(''); setScheduledDateFilter('');}}
                                disabled={!scheduled_instructor_filter && !scheduled_date_filter}
                            >
                                Clear Filters
                            </Button>
                        </Box>

                        {/* Loading / Error / Table Display */}
                        {is_loading_scheduled ? (
                            <CircularProgress />
                        ) : scheduled_error ? (
                            <Alert severity="error">{scheduled_error}</Alert>
                        ) : (
                            <ScheduledCoursesTable 
                                courses={filtered_scheduled_courses} 
                                onViewStudentsClick={handleViewStudentsClick} 
                                onCancelClick={handleCancelClick}
                            />
                        )}
                    </>
                );
            }
            case 'completed': {
                // Apply sorting
                const sorted_completed_courses = [...completed_courses].sort((a, b) => {
                    let compare_a, compare_b;
                    if (completed_sort_by === 'date') {
                        // Assuming date_scheduled is the completion date for now
                        compare_a = new Date(a.date_scheduled || 0); 
                        compare_b = new Date(b.date_scheduled || 0);
                    } else if (completed_sort_by === 'organization') {
                        compare_a = a.organization_name || '';
                        compare_b = b.organization_name || '';
                    } else { // instructor_name
                        compare_a = a.instructor_name || '';
                        compare_b = b.instructor_name || '';
                    }
                    
                    if (compare_b < compare_a) {
                        return (completed_sort_order === 'asc' ? 1 : -1);
                    }
                    if (compare_b > compare_a) {
                        return (completed_sort_order === 'asc' ? -1 : 1);
                    }
                    return 0;
                });

                logger.info(`[renderSelectedView: completed] State: isLoading=${is_loading_completed}, error=${completed_error}, SORTED_COURSES_LEN=${sorted_completed_courses.length}`);
                if (is_loading_completed) {
                    return <CircularProgress />;
                }
                if (completed_error) {
                    return <Alert severity="error">{completed_error}</Alert>;
                }
                return (
                    <CompletedCoursesTable 
                        courses={sorted_completed_courses}
                        onViewStudentsClick={handleViewStudentsClick}
                        onBillClick={handleBillClick}
                        sortOrder={completed_sort_order}
                        sortBy={completed_sort_by}
                        onSortRequest={handleCompletedSortRequest}
                    />
                );
            }
            case 'reports': 
                 logger.info('[renderSelectedView: reports]');
                 return <AdminReportsView />;
            default:
                return <Typography>Select a view</Typography>;
        }
    };

    return (
        <Box sx={{ display: 'flex' }}>
            {/* --- AppBar --- */}
            <AppBar
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
                        Course Admin Portal
                    </Typography>
                    <Typography variant="body1" noWrap sx={{ mr: 2 }}>
                        Welcome {user?.first_name || 'Admin User'}!
                    </Typography>
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
                        // mt: 8, // Remove offset handled by Toolbar
                        // height: 'calc(100% - 64px)' // Remove if not needed
                    },
                }}
            >
                {/* Toolbar spacer */}
                 <Toolbar />
                 <Box sx={{ overflow: 'auto' }}>
                     <List>
                        {/* Dashboard Item */}
                        <ListItem 
                            component="div" 
                            selected={selected_view === 'dashboard'}
                            onClick={() => setSelectedView('dashboard')}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selected_view === 'dashboard' ? 'primary.light' : 'transparent',
                                color: selected_view === 'dashboard' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selected_view === 'dashboard' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selected_view === 'dashboard' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}>
                                <DashboardIcon />
                            </ListItemIcon>
                            <ListItemText primary="Dashboard" />
                        </ListItem>

                        {/* Instructor Dashboard Item */}
                        <ListItem 
                            component="div" 
                            selected={selected_view === 'instructors'}
                            onClick={() => setSelectedView('instructors')}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selected_view === 'instructors' ? 'primary.light' : 'transparent',
                                color: selected_view === 'instructors' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selected_view === 'instructors' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selected_view === 'instructors' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}>
                                <PeopleIcon />
                            </ListItemIcon>
                            <ListItemText primary="Instructor Dashboard" />
                        </ListItem>

                         {/* Pending Courses Item */}
                        <ListItem 
                            component="div" 
                            selected={selected_view === 'pending'}
                            onClick={() => setSelectedView('pending')}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selected_view === 'pending' ? 'primary.light' : 'transparent',
                                color: selected_view === 'pending' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selected_view === 'pending' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selected_view === 'pending' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}>
                                <PendingActionsIcon />
                            </ListItemIcon>
                            <ListItemText primary="Pending Courses" />
                        </ListItem>

                        {/* Scheduled Courses Item */}
                        <ListItem 
                            component="div" 
                            selected={selected_view === 'scheduled'}
                            onClick={() => setSelectedView('scheduled')}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selected_view === 'scheduled' ? 'primary.light' : 'transparent',
                                color: selected_view === 'scheduled' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selected_view === 'scheduled' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selected_view === 'scheduled' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}>
                                <EventAvailableIcon />
                            </ListItemIcon>
                            <ListItemText primary="Scheduled Courses" />
                        </ListItem>

                        {/* Completed Courses Item */}
                        <ListItem 
                            component="div" 
                            selected={selected_view === 'completed'}
                            onClick={() => setSelectedView('completed')}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selected_view === 'completed' ? 'primary.light' : 'transparent',
                                color: selected_view === 'completed' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selected_view === 'completed' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selected_view === 'completed' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}>
                                <CompletedIcon />
                            </ListItemIcon>
                            <ListItemText primary="Completed Courses" />
                        </ListItem>

                        {/* Reports Item - NEW */}
                         <ListItem 
                            component="div"
                            selected={selected_view === 'reports'}
                            onClick={() => setSelectedView('reports')}
                             sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selected_view === 'reports' ? 'primary.light' : 'transparent',
                                color: selected_view === 'reports' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selected_view === 'reports' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selected_view === 'reports' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}><ReportsIcon /></ListItemIcon>
                            <ListItemText primary="Reports" />
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
            {/* --- Main Content --- */}
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}> 
                {/* Toolbar spacer */}
                <Toolbar />
                <Container maxWidth="lg">
                    {renderSelectedView()}
                </Container>
            </Box>

            {show_view_students_dialog && (
                <ViewStudentsDialog
                    open={show_view_students_dialog}
                    onClose={handleViewStudentsDialogClose}
                    course_id={selected_course_for_view}
                />
            )}

            {show_schedule_dialog && (
                <ScheduleCourseDialog
                    open={show_schedule_dialog}
                    onClose={handleScheduleDialogClose}
                    course={selected_course_for_schedule}
                    onCourseScheduled={handleCourseSuccessfullyScheduled}
                />
            )}

            {/* Cancel Course Dialog */} 
            <CancelCourseDialog
                open={show_cancel_dialog}
                onClose={handleCancelDialogClose}
                onConfirm={handleConfirmCancel}
                course_id={course_to_cancel?.course_id}
                course_number={course_to_cancel?.course_number}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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

export default CourseAdminPortal; 