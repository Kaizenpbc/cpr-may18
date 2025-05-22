import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { format } from 'date-fns';
import pool from '../config/database';

const router = express.Router();

// Get instructor's classes
router.get('/classes', authenticateToken, async (req, res) => {
    try {
        const instructorId = req.user?.userId;
        const result = await pool.query(
            'SELECT id, date, start_time, end_time, status FROM classes WHERE instructor_id = $1 AND date >= CURRENT_DATE ORDER BY date, start_time',
            [instructorId]
        );
        
        res.json({
            success: true,
            data: result.rows.map(row => ({
                id: row.id,
                date: format(row.date, 'yyyy-MM-dd'),
                startTime: format(row.start_time, 'HH:mm'),
                endTime: format(row.end_time, 'HH:mm'),
                status: row.status,
                instructorId: instructorId
            }))
        });
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch classes' });
    }
});

// Get instructor's upcoming classes
router.get('/classes/upcoming', authenticateToken, async (req, res) => {
    try {
        const instructorId = req.user?.userId;
        const result = await pool.query(
            'SELECT id, date, start_time, end_time, status FROM classes WHERE instructor_id = $1 AND date >= CURRENT_DATE ORDER BY date, start_time LIMIT 5',
            [instructorId]
        );
        
        res.json({
            success: true,
            data: result.rows.map(row => ({
                id: row.id,
                date: format(row.date, 'yyyy-MM-dd'),
                startTime: format(row.start_time, 'HH:mm'),
                endTime: format(row.end_time, 'HH:mm'),
                status: row.status,
                instructorId: instructorId
            }))
        });
    } catch (error) {
        console.error('Error fetching upcoming classes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch upcoming classes' });
    }
});

// Get instructor availability
router.get('/availability', authenticateToken, async (req, res) => {
    try {
        const instructorId = req.user?.userId;
        const result = await pool.query(
            'SELECT date FROM instructor_availability WHERE instructor_id = $1 AND date >= CURRENT_DATE ORDER BY date',
            [instructorId]
        );
        
        res.json({
            success: true,
            data: result.rows.map(row => ({
                date: format(row.date, 'yyyy-MM-dd'),
                instructorId: instructorId
            }))
        });
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch availability' });
    }
});

// Add availability date
router.post('/availability', authenticateToken, async (req, res) => {
    try {
        const instructorId = req.user?.userId;
        const { date } = req.body;

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }

        await pool.query(
            'INSERT INTO instructor_availability (instructor_id, date) VALUES ($1, $2)',
            [instructorId, date]
        );

        res.json({ success: true, message: 'Availability added successfully' });
    } catch (error) {
        console.error('Error adding availability:', error);
        res.status(500).json({ success: false, message: 'Failed to add availability' });
    }
});

// Remove availability date
router.delete('/availability/:date', authenticateToken, async (req, res) => {
    try {
        const instructorId = req.user?.userId;
        const { date } = req.params;

        await pool.query(
            'DELETE FROM instructor_availability WHERE instructor_id = $1 AND date = $2',
            [instructorId, date]
        );

        res.json({ success: true, message: 'Availability removed successfully' });
    } catch (error) {
        console.error('Error removing availability:', error);
        res.status(500).json({ success: false, message: 'Failed to remove availability' });
    }
});

export default router; 