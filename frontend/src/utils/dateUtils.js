import { isSameDay } from 'date-fns';

/**
 * Format a date string or Date object into a readable format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string (e.g., "January 1, 2024")
 */
export const formatDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Format a date string or Date object into a short format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string (e.g., "Jan 1, 2024")
 */
export const formatShortDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Format a date string or Date object into a time format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted time string (e.g., "2:30 PM")
 */
export const formatTime = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Get the color for a date based on its status
 * @param {Date} date - The date to check
 * @param {Array} availableDates - Array of available dates
 * @param {Array} scheduledClasses - Array of scheduled classes
 * @param {Array} holidays - Array of holidays
 * @returns {string} Color string for the date
 */
export const getDateColor = (date, availableDates, scheduledClasses, holidays) => {
    if (holidays.some(h => isSameDay(new Date(h.date), date))) {
        return 'red';
    }
    if (scheduledClasses.some(c => isSameDay(new Date(c.date), date))) {
        return 'blue';
    }
    if (availableDates.some(d => isSameDay(d, date))) {
        return 'green';
    }
    return 'gray';
}; 