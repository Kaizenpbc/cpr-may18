import React from 'react';
import { 
    Box, Typography, IconButton, Paper, Tooltip, 
    Grid, Stack, Divider 
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';

const CalendarView = ({
    currentDate,
    handlePreviousMonth,
    handleNextMonth,
    availableDates,
    scheduledClasses,
    ontarioHolidays2024,
    handleDateClick,
    viewType // 'availability' or 'classes'
}) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday
    const today = new Date();

    // Create calendar grid array with proper padding for alignment
    const calendarDays = [];
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }
    
    // Add the actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(new Date(year, month, day));
    }
    
    // Add empty cells to complete the last week if needed
    const totalCells = Math.ceil(calendarDays.length / 7) * 7;
    while (calendarDays.length < totalCells) {
        calendarDays.push(null);
    }

    // Split into weeks
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Box sx={{ 
            width: '100%', 
            maxWidth: '500px', 
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
                    width: '100%',
                    boxSizing: 'border-box'
                }}
            >
                {/* Calendar Header */}
                <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 0.5,
                    mb: 2,
                    alignItems: 'center',
                    width: '100%',
                    border: 1,
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    p: 1,
                    boxSizing: 'border-box',
                    '& > *': {
                        width: '100%',
                        boxSizing: 'border-box'
                    }
                }}>
                    <IconButton 
                        onClick={handlePreviousMonth}
                        size="small"
                        sx={{ 
                            gridColumn: '1',
                            justifySelf: 'center'
                        }}
                    >
                        <NavigateBeforeIcon />
                    </IconButton>
                    <Typography 
                        variant="h5" 
                        sx={{ 
                            gridColumn: '2/7',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: 'primary.main',
                            width: '100%'
                        }}
                    >
                        {monthName} {year}
                    </Typography>
                    <IconButton 
                        onClick={handleNextMonth}
                        size="small"
                        sx={{ 
                            gridColumn: '7',
                            justifySelf: 'center'
                        }}
                    >
                        <NavigateNextIcon />
                    </IconButton>
                </Box>

                {/* Legend */}
                <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 0.5,
                    mb: 2
                }}>
                    <Box sx={{ 
                        gridColumn: '1/-1',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 2,
                        p: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {viewType === 'availability' ? (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EventAvailableIcon sx={{ color: 'success.main' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Available</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EventBusyIcon sx={{ color: 'primary.main' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Scheduled</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <HolidayVillageIcon sx={{ color: 'error.light' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Holiday</Typography>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventBusyIcon sx={{ color: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>Scheduled Class</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Calendar Grid */}
                <Box sx={{ 
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 0.25,
                    '& > *': {
                        minHeight: 0,
                        aspectRatio: '1/1',
                        width: '100%',
                        boxSizing: 'border-box'
                    }
                }}>
                    {/* Days of Week Header */}
                    {daysOfWeek.map((day) => (
                        <Box 
                            key={day}
                            sx={{
                                textAlign: 'center',
                                py: 0.5,
                                fontWeight: 600,
                                color: 'text.primary',
                                bgcolor: 'primary.light',
                                borderRadius: 1,
                                letterSpacing: '0.5px',
                                fontSize: '0.8rem',
                                aspectRatio: 'unset' // Override square aspect ratio for header
                            }}
                        >
                            {day}
                        </Box>
                    ))}

                    {/* Calendar Days */}
                    {weeks.flat().map((date, index) => {
                        if (!date) {
                            return (
                                <Box 
                                    key={`empty-${index}`}
                                    sx={{ 
                                        bgcolor: 'grey.50',
                                        borderRadius: 1
                                    }} 
                                />
                            );
                        }

                        const isoDateString = date.toISOString().split('T')[0];
                        const isToday = date.toDateString() === today.toDateString();
                        const isPastDate = date < today;
                        const isAvailable = Array.isArray(availableDates) 
                            ? availableDates.includes(isoDateString)
                            : availableDates?.has?.(isoDateString) ?? false;
                        const isHoliday = Array.isArray(ontarioHolidays2024)
                            ? ontarioHolidays2024.includes(isoDateString)
                            : ontarioHolidays2024?.has?.(isoDateString) ?? false;
                        const scheduledClass = scheduledClasses?.find(course => 
                            course.datescheduled && 
                            new Date(course.datescheduled).toISOString().split('T')[0] === isoDateString
                        );

                        let bgColor = 'background.paper';
                        let statusIcon = null;
                        let tooltipText = '';

                        if (viewType === 'availability') {
                            if (scheduledClass) {
                                bgColor = 'primary.light';
                                statusIcon = <EventBusyIcon sx={{ color: 'white' }} />;
                                tooltipText = `Scheduled: ${scheduledClass.organizationname || 'N/A'}`;
                            } else if (isHoliday) {
                                bgColor = 'error.light';
                                statusIcon = <HolidayVillageIcon sx={{ color: 'white' }} />;
                                tooltipText = 'Holiday';
                            } else if (isAvailable) {
                                bgColor = 'success.light';
                                statusIcon = <EventAvailableIcon sx={{ color: 'white' }} />;
                                tooltipText = 'Available for scheduling';
                            }
                        } else {
                            if (scheduledClass) {
                                bgColor = 'primary.light';
                                statusIcon = <EventBusyIcon sx={{ color: 'white' }} />;
                                tooltipText = `${scheduledClass.coursetypename} - ${scheduledClass.organizationname}`;
                            }
                        }

                        return (
                            <Tooltip key={isoDateString} title={tooltipText} arrow>
                                <Paper
                                    elevation={isToday ? 3 : 1}
                                    onClick={() => handleDateClick(date)}
                                    sx={{
                                        height: '100%',
                                        p: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        bgcolor: bgColor,
                                        cursor: !isPastDate && (isAvailable || scheduledClass) ? 'pointer' : 'default',
                                        border: isToday ? 2 : 0,
                                        borderColor: 'primary.main',
                                        borderRadius: 1,
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: !isPastDate && (isAvailable || scheduledClass) ? 'scale(1.05)' : 'none',
                                            boxShadow: !isPastDate && (isAvailable || scheduledClass) ? '0 8px 16px rgba(0,0,0,0.1)' : 1
                                        }
                                    }}
                                >
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <Typography 
                                            variant="body2"
                                            sx={{
                                                fontWeight: isToday ? 700 : 500,
                                                color: isPastDate ? 'text.disabled' : 
                                                    (bgColor !== 'background.paper' ? 'white' : 'text.primary'),
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            {date.getDate()}
                                        </Typography>
                                        {statusIcon}
                                    </Box>
                                    {isAvailable && !scheduledClass && (
                                        <Typography 
                                            variant="subtitle1"
                                            sx={{ 
                                                mt: 'auto',
                                                textAlign: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            A
                                        </Typography>
                                    )}
                                    {scheduledClass && (
                                        <Typography 
                                            variant="caption"
                                            sx={{ 
                                                mt: 'auto',
                                                color: 'white',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontWeight: 500,
                                                fontSize: '0.7rem'
                                            }}
                                        >
                                            {scheduledClass.coursetypename}
                                        </Typography>
                                    )}
                                </Paper>
                            </Tooltip>
                        );
                    })}
                </Box>
            </Paper>
        </Box>
    );
};

export default CalendarView; 