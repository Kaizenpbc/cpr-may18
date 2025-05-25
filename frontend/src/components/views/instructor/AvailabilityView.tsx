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
    DialogActions,
    Snackbar
} from '@mui/material';
import {
    Event as EventIcon,
    EventAvailable as EventAvailableIcon,
    EventBusy as EventBusyIcon,
    HolidayVillage as HolidayVillageIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import type { Class, Availability, ApiResponse } from '../../../types/api';
import api from '../../../api/index';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AvailabilityViewProps {
    availableDates: string[];
    scheduledClasses: any[];
    onAddAvailability?: (date: string) => Promise<{ success: boolean; error?: string }>;
    onRemoveAvailability?: (date: string) => Promise<{ success: boolean; error?: string }>;
    onRefresh?: () => void;
    ontarioHolidays2024?: string[];
}

interface ConfirmationState {
    open: boolean;
    date: string;
    action: 'add' | 'remove';
    isAvailable: boolean;
}

const AvailabilityView: React.FC<AvailabilityViewProps> = ({
    availableDates: propAvailableDates,
    scheduledClasses: propScheduledClasses,
    onAddAvailability,
    onRemoveAvailability,
    onRefresh,
    ontarioHolidays2024
}) => {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [scheduledClasses, setScheduledClasses] = useState<any[]>(propScheduledClasses || []);
    const [holidays, setHolidays] = useState<string[]>(ontarioHolidays2024 || []);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationState>({
        open: false,
        date: '',
        action: 'add',
        isAvailable: false
    });
    const [successMessage, setSuccessMessage] = useState<string>('');

    const availableDates = propAvailableDates || [];

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
    }, [isAuthenticated]);

    const handleUnauthorized = async () => {
        await logout();
        navigate('/login');
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
                
                if (onRemoveAvailability) {
                    const result = await onRemoveAvailability(dateStr);
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to remove availability');
                    }
                } else {
                    await api.delete(`/api/v1/instructor/availability/${dateStr}`);
                }
                
                console.log('[AvailabilityView] Updated available dates after removal:', availableDates.filter(d => d !== dateStr));
                setSuccessMessage(`Removed availability for ${dateStr}`);
            } else {
                console.log('[AvailabilityView] Adding availability for:', dateStr);
                
                if (onAddAvailability) {
                    const result = await onAddAvailability(dateStr);
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to add availability');
                    }
                } else {
                    await api.post('/api/v1/instructor/availability', { date: dateStr });
                }
                
                console.log('[AvailabilityView] Updated available dates after addition:', [...availableDates, dateStr]);
                setSuccessMessage(`Added availability for ${dateStr}`);
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
        
        const isScheduled = scheduledClasses.some(c => {
            // Check multiple possible date field names from backend
            const classDate = c.date || c.datescheduled;
            return classDate === dateStr;
        });
        
        const isHoliday = holidays.includes(dateStr);
        const isPastDate = day < new Date(new Date().setHours(0, 0, 0, 0));
        
        // Color scheduled classes BLUE and available dates GREEN
        let backgroundColor, hoverColor, tooltipTitle, textColor;
        
        if (isScheduled) {
            // Blue = Scheduled Classes
            backgroundColor = theme.palette.primary.main;
            hoverColor = theme.palette.primary.dark;
            textColor = 'white';
            const classInfo = scheduledClasses.find(c => (c.date || c.datescheduled) === dateStr);
            tooltipTitle = `Scheduled: ${classInfo?.organizationname || 'Class'}`;
        } else if (isAvailable) {
            // Green = Available
            backgroundColor = theme.palette.success.main;
            hoverColor = theme.palette.success.dark;
            textColor = 'white';
            tooltipTitle = 'Available - Click to remove';
        } else {
            // All other dates use default styling
            backgroundColor = 'inherit';
            hoverColor = theme.palette.action.hover;
            textColor = 'inherit';
            
            if (isHoliday) {
                tooltipTitle = 'Holiday';
            } else if (isPastDate) {
                tooltipTitle = 'Past Date';
            } else {
                tooltipTitle = 'Click to mark as available';
            }
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
                                    <Typography variant="body2">Available</Typography>
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
                                    <Typography variant="body2">Scheduled Classes</Typography>
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
            
            {/* Success Snackbar */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage('')}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AvailabilityView; 