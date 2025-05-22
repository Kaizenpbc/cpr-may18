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
    useTheme
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
import type { DayProps } from '@mui/x-date-pickers';
import type { Class, Availability, ApiResponse } from '../../../types/api';
import api from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
    availableDates?: string[];
    scheduledClasses?: Class[];
    ontarioHolidays2024?: string[];
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

        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isAvailable = availableDates.includes(dateStr);
            
            if (isAvailable) {
                await api.delete(`/api/v1/instructor/availability/${dateStr}`);
                setAvailableDates(prev => prev.filter(d => d !== dateStr));
            } else {
                await api.post('/api/v1/instructor/availability', { date: dateStr });
                setAvailableDates(prev => [...prev, dateStr]);
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                handleUnauthorized();
                return;
            }
            setError('Failed to update availability');
            console.error('Error updating availability:', error);
        }
    };

    const dayRenderer = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const isAvailable = availableDates.includes(dateStr);
        const isScheduled = scheduledClasses.some(c => format(parseISO(c.date), 'yyyy-MM-dd') === dateStr);
        const isHoliday = holidays.includes(dateStr);

        let tooltipTitle = '';
        if (isScheduled) {
            const classInfo = scheduledClasses.find(c => format(parseISO(c.date), 'yyyy-MM-dd') === dateStr);
            tooltipTitle = `Scheduled: ${classInfo?.organization}`;
        } else if (isAvailable) {
            tooltipTitle = 'Available';
        } else if (isHoliday) {
            tooltipTitle = 'Holiday';
        }

        return {
            sx: {
                backgroundColor: isScheduled
                    ? `${theme.palette.primary.main}!important`
                    : isAvailable
                    ? `${theme.palette.success.main}!important`
                    : isHoliday
                    ? `${theme.palette.warning.light}!important`
                    : 'inherit',
                color: (isScheduled || isAvailable || isHoliday) ? 'white!important' : 'inherit',
                '&:hover': {
                    backgroundColor: isScheduled
                        ? `${theme.palette.primary.dark}!important`
                        : isAvailable
                        ? `${theme.palette.success.dark}!important`
                        : isHoliday
                        ? `${theme.palette.warning.main}!important`
                        : 'inherit'
                }
            },
            disabled: false,
            selected: false,
            today: format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
        };
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
                                onChange={handleDateClick}
                                onMonthChange={(date) => date && setCurrentDate(date)}
                                slotProps={{
                                    day: (props) => dayRenderer(props.day)
                                }}
                            />
                        </LocalizationProvider>
                    </Box>
                    <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: '300px' } }}>
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Legend
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EventAvailableIcon sx={{ color: theme.palette.success.main }} />
                                    <Typography>Available</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EventBusyIcon sx={{ color: theme.palette.primary.main }} />
                                    <Typography>Scheduled Class</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <HolidayVillageIcon sx={{ color: theme.palette.warning.light }} />
                                    <Typography>Holiday</Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default AvailabilityView; 