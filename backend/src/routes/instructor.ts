import express from 'express';
import { format } from 'date-fns';
import { pool } from '../config/database';
import { ApiResponseBuilder } from '../utils/apiResponse';
import { errorCodes } from '../utils/errorHandler';

const router = express.Router();

// Debug endpoint to test authentication
router.get('/debug', async (req, res) => {
    console.log('[Debug] Instructor debug endpoint hit');
    console.log('[Debug] User from token:', req.user);
    res.json(ApiResponseBuilder.success({
        message: 'Authentication working',
        user: req.user,
        timestamp: new Date().toISOString()
    }));
});

// Get instructor's classes
router.get('/classes', async (req, res) => {
    try {
        const instructorId = parseInt(req.user?.userId || '0', 10);
        if (!instructorId) {
            return res.status(400).json(ApiResponseBuilder.error(errorCodes.VALIDATION_ERROR, 'Invalid instructor ID'));
        }
        
        console.log('[Debug] Fetching classes for instructor ID:', instructorId);
        const result = await pool.query(
            `SELECT c.id, c.date::text, c.start_time::text, c.end_time::text, c.status, c.location, 
                    ct.name as type, c.max_students, c.current_students 
             FROM classes c 
             LEFT JOIN class_types ct ON c.type_id = ct.id 
             WHERE c.instructor_id = $1 AND c.date >= CURRENT_DATE 
             ORDER BY c.date, c.start_time`,
            [instructorId]
        );
        
        res.json(ApiResponseBuilder.success(result.rows.map(row => ({
            id: row.id.toString(),
            type: row.type || 'CPR Class',
            date: row.date.split('T')[0],
            time: row.start_time ? row.start_time.slice(0, 5) : '09:00',
            location: row.location || 'TBD',
            instructor_id: instructorId.toString(),
            max_students: row.max_students || 10,
            current_students: row.current_students || 0,
            status: row.status || 'scheduled'
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
            `SELECT c.id, c.date::text, c.start_time::text, c.end_time::text, c.status, ct.name as type
             FROM classes c 
             LEFT JOIN class_types ct ON c.type_id = ct.id 
             WHERE c.instructor_id = $1 AND c.date >= CURRENT_DATE 
             ORDER BY c.date, c.start_time LIMIT 5`,
            [instructorId]
        );
        
        res.json(ApiResponseBuilder.success(result.rows.map(row => ({
            id: row.id,
            date: row.date.split('T')[0],
            startTime: row.start_time.slice(0, 5),
            endTime: row.end_time.slice(0, 5),
            status: row.status,
            type: row.type || 'CPR Class',
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
        const instructorId = parseInt(req.user?.userId || '0', 10);
        if (!instructorId) {
            return res.status(400).json(ApiResponseBuilder.error(errorCodes.VALIDATION_ERROR, 'Invalid instructor ID'));
        }
        
        console.log('[Debug] Fetching availability for instructor ID:', instructorId);
        const result = await pool.query(
            'SELECT id, instructor_id, date::text, status, created_at, updated_at FROM instructor_availability WHERE instructor_id = $1 AND date >= CURRENT_DATE ORDER BY date',
            [instructorId]
        );
        
        res.json(ApiResponseBuilder.success(result.rows.map(row => ({
            id: row.id.toString(),
            instructor_id: row.instructor_id.toString(),
            date: row.date.split('T')[0],
            start_time: '09:00', // Default time since availability doesn't have specific times
            end_time: '17:00',   // Default time since availability doesn't have specific times
            status: row.status || 'available'
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

// Get instructor's scheduled classes (alias for /classes)
router.get('/schedule', async (req, res) => {
    try {
        const instructorId = parseInt(req.user?.userId || '0', 10);
        if (!instructorId) {
            return res.status(400).json(ApiResponseBuilder.error(errorCodes.VALIDATION_ERROR, 'Invalid instructor ID'));
        }
        
        const result = await pool.query(
            `SELECT c.id, c.date::text, c.start_time::text, c.end_time::text, c.status, c.location, 
                    ct.name as type, c.max_students, c.current_students 
             FROM classes c 
             LEFT JOIN class_types ct ON c.type_id = ct.id 
             WHERE c.instructor_id = $1 AND c.date >= CURRENT_DATE 
             ORDER BY c.date, c.start_time`,
            [instructorId]
        );
        
        res.json(ApiResponseBuilder.success(result.rows.map(row => ({
            id: row.id.toString(),
            type: row.type || 'CPR Class',
            date: row.date.split('T')[0],
            time: row.start_time ? row.start_time.slice(0, 5) : '09:00',
            location: row.location || 'TBD',
            instructor_id: instructorId.toString(),
            max_students: row.max_students || 10,
            current_students: row.current_students || 0,
            status: row.status || 'scheduled'
        }))));
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json(ApiResponseBuilder.error(errorCodes.SERVICE_UNAVAILABLE, 'Failed to fetch schedule'));
    }
});

export default router; 