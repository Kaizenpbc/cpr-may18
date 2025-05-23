import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import {
    Event as EventIcon,
    EventAvailable as EventAvailableIcon,
    EventBusy as EventBusyIcon,
    HolidayVillage as HolidayVillageIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import type { Class, Availability, ApiResponse } from '../../../types/api';
import api from '../../../api/index';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
    availableDates?: string[];
    scheduledClasses?: Class[];
    ontarioHolidays2024?: string[];
}

interface ConfirmationState {
    open: boolean;
    date: string;
    action: 'add' | 'remove';
    isAvailable: boolean;
}

const AvailabilityView: React.FC<Props> = ({
    availableDates: propAvailableDates,
    scheduledClasses: propScheduledClasses,
    ontarioHolidays2024
}) => {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [availableDates, setAvailableDates] = useState<string[]>(propAvailableDates || []);
    const [scheduledClasses, setScheduledClasses] = useState<Class[]>(propScheduledClasses || []);
    const [holidays, setHolidays] = useState<string[]>(ontarioHolidays2024 || []);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationState>({
        open: false,
        date: '',
        action: 'add',
        isAvailable: false
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (!propAvailableDates) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const handleUnauthorized = async () => {
        await logout();
        navigate('/login');
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [availabilityRes, classesRes] = await Promise.all([
                api.get<ApiResponse<Availability[]>>('/api/v1/instructor/availability'),
                api.get<ApiResponse<Class[]>>('/api/v1/instructor/classes')
            ]);
            
            setAvailableDates(availabilityRes.data.data.map(a => a.date));
            setScheduledClasses(classesRes.data.data);
            setError(null);
        } catch (err: any) {
            if (err.response?.status === 401) {
                handleUnauthorized();
                return;
            }
            setError('Failed to load calendar data');
            console.error('Error loading calendar data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = async (date: Date | null) => {
        if (!date || !isAuthenticated) {
            return;
        }

        const dateStr = format(date, 'yyyy-MM-dd');
        const isAvailable = availableDates.includes(dateStr);
        
        // Show confirmation dialog
        setConfirmation({
            open: true,
            date: dateStr,
            action: isAvailable ? 'remove' : 'add',
            isAvailable
        });
    };

    const handleConfirmationClose = () => {
        setConfirmation({
            open: false,
            date: '',
            action: 'add',
            isAvailable: false
        });
    };

    const handleConfirmationConfirm = async () => {
        try {
            const { date: dateStr, isAvailable } = confirmation;
            console.log('[AvailabilityView] Confirming action:', confirmation.action, 'for date:', dateStr);
            
            if (isAvailable) {
                console.log('[AvailabilityView] Removing availability for:', dateStr);
                await api.delete(`/api/v1/instructor/availability/${dateStr}`);
                setAvailableDates(prev => {
                    const newDates = prev.filter(d => d !== dateStr);
                    console.log('[AvailabilityView] Updated available dates after removal:', newDates);
                    return newDates;
                });
            } else {
                console.log('[AvailabilityView] Adding availability for:', dateStr);
                await api.post('/api/v1/instructor/availability', { date: dateStr });
                setAvailableDates(prev => {
                    const newDates = [...prev, dateStr];
                    console.log('[AvailabilityView] Updated available dates after addition:', newDates);
                    return newDates;
                });
            }
            
            setError(null);
            console.log('[AvailabilityView] Operation completed successfully');
        } catch (error: any) {
            if (error.response?.status === 401) {
                handleUnauthorized();
                return;
            }
            setError('Failed to update availability');
            console.error('Error updating availability:', error);
        } finally {
            handleConfirmationClose();
        }
    };

    const CustomDay = (props: any) => {
        const { day, ...other } = props;
        const dateStr = format(day, 'yyyy-MM-dd');
        const isAvailable = availableDates.includes(dateStr);
        const isScheduled = scheduledClasses.some(c => format(parseISO(c.date), 'yyyy-MM-dd') === dateStr);
        const isHoliday = holidays.includes(dateStr);
        const isPastDate = day < new Date(new Date().setHours(0, 0, 0, 0));
        
        // Determine day status and color
        let backgroundColor, hoverColor, tooltipTitle, textColor = 'white';
        
        if (isScheduled) {
            // 🔵 Blue = Scheduled Classes
            backgroundColor = theme.palette.primary.main;
            hoverColor = theme.palette.primary.dark;
            const classInfo = scheduledClasses.find(c => format(parseISO(c.date), 'yyyy-MM-dd') === dateStr);
            tooltipTitle = `🔵 Scheduled: ${classInfo?.organization || 'Class'}`;
        } else if (isAvailable) {
            // 🟢 Green = Available
            backgroundColor = theme.palette.success.main;
            hoverColor = theme.palette.success.dark;
            tooltipTitle = '🟢 Available - Click to remove';
        } else if (isHoliday) {
            // 🟡 Yellow = Partially Available (using holidays as an example)
            backgroundColor = theme.palette.warning.main;
            hoverColor = theme.palette.warning.dark;
            tooltipTitle = '🟡 Holiday (Partially Available)';
        } else if (isPastDate) {
            // 🔴 Red = Unavailable/Booked (past dates)
            backgroundColor = theme.palette.error.main;
            hoverColor = theme.palette.error.dark;
            tooltipTitle = '🔴 Unavailable (Past Date)';
        } else {
            // Default state - can be marked as available
            backgroundColor = 'inherit';
            hoverColor = theme.palette.action.hover;
            textColor = 'inherit';
            tooltipTitle = 'Click to mark as available';
        }

        const handleDayClick = () => {
            if (isPastDate || isScheduled) {
                return; // Don't allow clicks on past dates or scheduled classes
            }
            
            console.log('Day clicked:', dateStr, 'isAvailable:', isAvailable);
            
            // Show confirmation dialog
            setConfirmation({
                open: true,
                date: dateStr,
                action: isAvailable ? 'remove' : 'add',
                isAvailable
            });
        };

        return (
            <Tooltip title={tooltipTitle} arrow>
                <PickersDay
                    {...other}
                    day={day}
                    onClick={handleDayClick}
                    disabled={isPastDate}
                    sx={{
                        backgroundColor: `${backgroundColor}!important`,
                        color: `${textColor}!important`,
                        cursor: (isPastDate || isScheduled) ? 'not-allowed' : 'pointer',
                        '&:hover': {
                            backgroundColor: `${hoverColor}!important`
                        },
                        '&.Mui-disabled': {
                            backgroundColor: `${backgroundColor}!important`,
                            color: `${textColor}!important`,
                            opacity: 0.7
                        }
                    }}
                />
            </Tooltip>
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Manage Your Availability
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Click on dates to mark them as available or unavailable for teaching.
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                    <Box sx={{ flex: '1 1 auto' }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateCalendar
                                value={currentDate}
                                onMonthChange={(date) => date && setCurrentDate(date)}
                                slots={{
                                    day: CustomDay
                                }}
                            />
                        </LocalizationProvider>
                    </Box>
                    <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: '300px' } }}>
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Legend
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box 
                                        sx={{ 
                                            width: 20, 
                                            height: 20, 
                                            borderRadius: '50%', 
                                            backgroundColor: theme.palette.success.main 
                                        }} 
                                    />
                                    <Typography variant="body2">🟢 Available</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box 
                                        sx={{ 
                                            width: 20, 
                                            height: 20, 
                                            borderRadius: '50%', 
                                            backgroundColor: theme.palette.error.main 
                                        }} 
                                    />
                                    <Typography variant="body2">🔴 Unavailable/Booked</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box 
                                        sx={{ 
                                            width: 20, 
                                            height: 20, 
                                            borderRadius: '50%', 
                                            backgroundColor: theme.palette.warning.main 
                                        }} 
                                    />
                                    <Typography variant="body2">🟡 Partially Available</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box 
                                        sx={{ 
                                            width: 20, 
                                            height: 20, 
                                            borderRadius: '50%', 
                                            backgroundColor: theme.palette.primary.main 
                                        }} 
                                    />
                                    <Typography variant="body2">🔵 Scheduled Classes</Typography>
                                </Box>
                                <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Click on any date to toggle availability
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                        
                        {/* Additional Info Panel */}
                        <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Quick Stats
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="body2">
                                    Available Days: <strong>{availableDates.length}</strong>
                                </Typography>
                                <Typography variant="body2">
                                    Scheduled Classes: <strong>{scheduledClasses.length}</strong>
                                </Typography>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Paper>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmation.open}
                onClose={handleConfirmationClose}
                aria-labelledby="confirmation-dialog-title"
                aria-describedby="confirmation-dialog-description"
            >
                <DialogTitle id="confirmation-dialog-title">
                    {confirmation.action === 'add' ? 'Add Availability' : 'Remove Availability'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="confirmation-dialog-description">
                        {confirmation.action === 'add' 
                            ? `Are you sure you want to mark ${confirmation.date} as available for teaching?`
                            : `Are you sure you want to remove your availability for ${confirmation.date}?`
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmationClose} color="inherit">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmationConfirm} 
                        color={confirmation.action === 'add' ? 'success' : 'error'}
                        variant="contained"
                        autoFocus
                    >
                        {confirmation.action === 'add' ? 'Add Availability' : 'Remove Availability'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AvailabilityView; 