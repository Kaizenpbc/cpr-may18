import axios from 'axios';
import logger from './utils/logger';
import { API_URL } from './config';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

export const getScheduledClasses = async () => {
    try {
        const response = await api.get('/api/classes/scheduled');
        return response.data;
    } catch (error) {
        logger.error('Error fetching scheduled classes:', error);
        throw error;
    }
};

export const getAvailability = async () => {
    try {
        const response = await api.get('/api/instructors/availability');
        return response.data;
    } catch (error) {
        logger.error('Error fetching availability:', error);
        throw error;
    }
};

export default api; 