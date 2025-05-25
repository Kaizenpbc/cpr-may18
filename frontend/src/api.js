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

// Accounting Portal API Functions
export const getAccountingDashboard = async () => {
    try {
        const response = await api.get('/api/v1/accounting/dashboard');
        return response.data;
    } catch (error) {
        logger.error('Error fetching accounting dashboard:', error);
        throw error;
    }
};

export const getCoursePricing = async () => {
    try {
        const response = await api.get('/api/v1/accounting/course-pricing');
        return response.data;
    } catch (error) {
        logger.error('Error fetching course pricing:', error);
        throw error;
    }
};

export const updateCoursePrice = async (pricingId, price) => {
    try {
        const response = await api.put(`/api/v1/accounting/course-pricing/${pricingId}`, { price });
        return response.data;
    } catch (error) {
        logger.error('Error updating course price:', error);
        throw error;
    }
};

// Invoice-related functions (placeholders for now since backend endpoints don't exist yet)
export const getInvoices = async () => {
    try {
        // This endpoint doesn't exist yet - return empty array for now
        return [];
    } catch (error) {
        logger.error('Error fetching invoices:', error);
        throw error;
    }
};

export const getInvoiceDetails = async (invoiceId) => {
    try {
        // This endpoint doesn't exist yet - return null for now
        return null;
    } catch (error) {
        logger.error('Error fetching invoice details:', error);
        throw error;
    }
};

export const getInvoicePayments = async (invoiceId) => {
    try {
        // This endpoint doesn't exist yet - return empty array for now
        return [];
    } catch (error) {
        logger.error('Error fetching invoice payments:', error);
        throw error;
    }
};

export const recordInvoicePayment = async (invoiceId, paymentData) => {
    try {
        // This endpoint doesn't exist yet - return success for now
        return { success: true };
    } catch (error) {
        logger.error('Error recording payment:', error);
        throw error;
    }
};

export const getBillingQueue = async () => {
    try {
        // This endpoint doesn't exist yet - return empty array for now
        return [];
    } catch (error) {
        logger.error('Error fetching billing queue:', error);
        throw error;
    }
};

export const createInvoice = async (courseId) => {
    try {
        // This endpoint doesn't exist yet - return success for now
        return { success: true, invoiceId: Date.now() };
    } catch (error) {
        logger.error('Error creating invoice:', error);
        throw error;
    }
};

// Report API functions (placeholders for now)
export const getRevenueReport = async (year) => {
    try {
        // This endpoint doesn't exist yet - return empty data for now
        return {
            year,
            months: [],
            totalRevenue: 0
        };
    } catch (error) {
        logger.error('Error fetching revenue report:', error);
        throw error;
    }
};

export const getInstructorWorkloadReport = async (startDate, endDate) => {
    try {
        // This endpoint doesn't exist yet - return empty data for now
        return [];
    } catch (error) {
        logger.error('Error fetching instructor workload report:', error);
        throw error;
    }
};

export const getArAgingReport = async () => {
    try {
        // This endpoint doesn't exist yet - return empty data for now
        return {
            buckets: [],
            totalOutstanding: 0
        };
    } catch (error) {
        logger.error('Error fetching AR aging report:', error);
        throw error;
    }
};

export default api; 