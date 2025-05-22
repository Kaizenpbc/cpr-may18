import express from 'express';
import { format } from 'date-fns';
import pool from '../config/database';
import { ApiResponseBuilder } from '../utils/apiResponse';
import { errorCodes } from '../utils/errorHandler';

const router = express.Router();

// Get instructor's classes
router.get('/classes', async (req, res) => {
    try {
        const instructorId = req.user?.userId;
        const result = await pool.query(
            'SELECT id, date::text, start_time::text, end_time::text, status FROM classes WHERE instructor_id = $1 AND date >= CURRENT_DATE ORDER BY date, start_time',
            [instructorId]
        );
        
        res.json(ApiResponseBuilder.success(result.rows.map(row => ({
            id: row.id,
            date: row.date.split('T')[0],
            startTime: row.start_time.slice(0, 5),
            endTime: row.end_time.slice(0, 5),
            status: row.status,
            instructorId: instructorId
        }))));
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json(ApiResponseBuilder.error(errorCodes.SERVICE_UNAVAILABLE, 'Failed to fetch classes'));
    }
});

// Get instructor's upcoming classes
router.get('/classes/upcoming', async (req, res) => {
    try {
        const instructorId = req.user?.userId;
        const result = await pool.query(
            'SELECT id, date::text, start_time::text, end_time::text, status FROM classes WHERE instructor_id = $1 AND date >= CURRENT_DATE ORDER BY date, start_time LIMIT 5',
            [instructorId]
        );
        
        res.json(ApiResponseBuilder.success(result.rows.map(row => ({
            id: row.id,
            date: row.date.split('T')[0],
            startTime: row.start_time.slice(0, 5),
            endTime: row.end_time.slice(0, 5),
            status: row.status,
            instructorId: instructorId
        }))));
    } catch (error) {
        console.error('Error fetching upcoming classes:', error);
        res.status(500).json(ApiResponseBuilder.error(errorCodes.SERVICE_UNAVAILABLE, 'Failed to fetch upcoming classes'));
    }
});

// Get instructor availability
router.get('/availability', async (req, res) => {
    try {
        const instructorId = req.user?.userId;
        const result = await pool.query(
            'SELECT date::text FROM instructor_availability WHERE instructor_id = $1 AND date >= CURRENT_DATE ORDER BY date',
            [instructorId]
        );
        
        res.json(ApiResponseBuilder.success(result.rows.map(row => ({
            date: row.date.split('T')[0],
            instructorId: instructorId
        }))));
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json(ApiResponseBuilder.error(errorCodes.SERVICE_UNAVAILABLE, 'Failed to fetch availability'));
    }
});

// Add availability date
router.post('/availability', async (req, res) => {
    try {
        const instructorId = req.user?.userId;
        const { date } = req.body;

        if (!date) {
            return res.status(400).json(ApiResponseBuilder.error(errorCodes.VALIDATION_ERROR, 'Date is required'));
        }

        await pool.query(
            'INSERT INTO instructor_availability (instructor_id, date) VALUES ($1, $2)',
            [instructorId, date]
        );

        res.json(ApiResponseBuilder.success({ message: 'Availability added successfully' }));
    } catch (error) {
        console.error('Error adding availability:', error);
        res.status(500).json(ApiResponseBuilder.error(errorCodes.SERVICE_UNAVAILABLE, 'Failed to add availability'));
    }
});

// Remove availability date
router.delete('/availability/:date', async (req, res) => {
    try {
        const instructorId = req.user?.userId;
        const { date } = req.params;

        await pool.query(
            'DELETE FROM instructor_availability WHERE instructor_id = $1 AND date = $2',
            [instructorId, date]
        );

        res.json(ApiResponseBuilder.success({ message: 'Availability removed successfully' }));
    } catch (error) {
        console.error('Error removing availability:', error);
        res.status(500).json(ApiResponseBuilder.error(errorCodes.SERVICE_UNAVAILABLE, 'Failed to remove availability'));
    }
});

export default router; 