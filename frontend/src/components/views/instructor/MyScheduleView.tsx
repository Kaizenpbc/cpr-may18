import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Chip,
    Grid,
    IconButton,
    Tooltip,
    useTheme
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import type { Class, Availability, ApiResponse } from '../../../types/api';
import api from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DayCalendarProps } from '@mui/x-date-pickers/DayCalendar';

interface ScheduleEntry {
    date: string;
    organization?: string;
    location?: string;
    classType?: string;
    notes?: string;
    status: 'AVAILABLE' | 'CONFIRMED';
}

const MyScheduleView: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadScheduleData();
    }, [isAuthenticated]);

    const handleUnauthorized = async () => {
        await logout();
        navigate('/login');
    };

    const formatDate = (dateString: string) => {
        const date = parseISO(dateString);
        return format(date, 'yyyy-MM-dd');
    };

    const loadScheduleData = async () => {
        try {
            setLoading(true);
            const [availabilityRes, classesRes] = await Promise.all([
                api.get<ApiResponse<Availability[]>>('/api/v1/instructor/availability'),
                api.get<ApiResponse<Class[]>>('/api/v1/instructor/classes')
            ]);

            const availabilityEntries: ScheduleEntry[] = availabilityRes.data.data.map(a => ({
                date: formatDate(a.date),
                status: 'AVAILABLE'
            }));

            const classEntries: ScheduleEntry[] = classesRes.data.data.map(c => ({
                date: formatDate(c.date),
                organization: c.organization,
                location: c.location,
                classType: c.courseType,
                notes: c.notes,
                status: 'CONFIRMED'
            }));

            const allEntries = [...availabilityEntries, ...classEntries].sort((a, b) => 
                parseISO(a.date).getTime() - parseISO(b.date).getTime()
            );

            setSchedule(allEntries);
            setError(null);
        } catch (err: any) {
            if (err.response?.status === 401) {
                handleUnauthorized();
                return;
            }
            setError('Failed to load schedule data');
            console.error('Error loading schedule data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getScheduleForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return schedule.find(entry => entry.date === dateStr);
    };

    const renderDay = (props: DayCalendarProps<Date>) => {
        const { day, ...other } = props;
        const scheduleEntry = getScheduleForDate(day);
        const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');

        return (
            <Tooltip
                title={scheduleEntry ? `${scheduleEntry.status}${scheduleEntry.organization ? ` - ${scheduleEntry.organization}` : ''}` : ''}
                arrow
            >
                <PickersDay
                    {...other}
                    day={day}
                    selected={isSelected}
                    sx={{
                        backgroundColor: scheduleEntry
                            ? scheduleEntry.status === 'CONFIRMED'
                                ? `${theme.palette.primary.main}!important`
                                : `${theme.palette.success.main}!important`
                            : 'inherit',
                        color: scheduleEntry ? 'white!important' : 'inherit',
                        '&:hover': {
                            backgroundColor: scheduleEntry
                                ? scheduleEntry.status === 'CONFIRMED'
                                    ? `${theme.palette.primary.dark}!important`
                                    : `${theme.palette.success.dark}!important`
                                : 'inherit'
                        }
                    }}
                />
            </Tooltip>
        );
    };

    const handleMonthChange = (date: Date) => {
        setCurrentMonth(date);
    };

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    const selectedSchedule = getScheduleForDate(selectedDate);

    return (
        <Container maxWidth="lg">
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        My Schedule
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        View your availability and scheduled classes
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateCalendar
                                value={selectedDate}
                                onChange={(newDate) => handleDateChange(newDate || new Date())}
                                onMonthChange={(newDate) => handleMonthChange(newDate || new Date())}
                                slots={{
                                    day: renderDay
                                }}
                                sx={{
                                    width: '100%',
                                    '.MuiPickersCalendarHeader-root': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        pl: 2,
                                        pr: 2
                                    }
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 2, height: '100%', minHeight: '300px' }}>
                            <Typography variant="h6" gutterBottom>
                                {format(selectedDate, 'MMMM d, yyyy')}
                            </Typography>
                            {selectedSchedule ? (
                                <Box>
                                    <Chip 
                                        label={selectedSchedule.status}
                                        color={selectedSchedule.status === 'CONFIRMED' ? 'primary' : 'success'}
                                        sx={{ mb: 2 }}
                                    />
                                    {selectedSchedule.status === 'CONFIRMED' && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body1">
                                                <strong>Organization:</strong> {selectedSchedule.organization}
                                            </Typography>
                                            <Typography variant="body1">
                                                <strong>Location:</strong> {selectedSchedule.location}
                                            </Typography>
                                            <Typography variant="body1">
                                                <strong>Class Type:</strong> {selectedSchedule.classType}
                                            </Typography>
                                            {selectedSchedule.notes && (
                                                <Typography variant="body1">
                                                    <strong>Notes:</strong> {selectedSchedule.notes}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                <Typography variant="body1" color="text.secondary">
                                    No schedule entry for this date
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            Schedule List
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Organization</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell>Class Type</TableCell>
                                        <TableCell>Notes</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {schedule.map((entry) => (
                                        <TableRow 
                                            key={`${entry.date}-${entry.status}`}
                                            onClick={() => setSelectedDate(parseISO(entry.date))}
                                            sx={{ 
                                                cursor: 'pointer',
                                                '&:hover': { backgroundColor: 'action.hover' },
                                                backgroundColor: format(selectedDate, 'yyyy-MM-dd') === entry.date 
                                                    ? 'action.selected' 
                                                    : 'inherit'
                                            }}
                                        >
                                            <TableCell>
                                                {format(parseISO(entry.date), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell>{entry.organization || '-'}</TableCell>
                                            <TableCell>{entry.location || '-'}</TableCell>
                                            <TableCell>{entry.classType || '-'}</TableCell>
                                            <TableCell>{entry.notes || '-'}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={entry.status}
                                                    color={entry.status === 'CONFIRMED' ? 'primary' : 'success'}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {schedule.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <Typography variant="body1" color="text.secondary">
                                                    No schedule entries found
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default MyScheduleView; 