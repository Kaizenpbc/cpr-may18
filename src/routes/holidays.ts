import express from 'express';

const router = express.Router();

// Ontario statutory holidays for 2024
const ONTARIO_HOLIDAYS_2024 = [
    '2024-01-01', // New Year's Day
    '2024-02-19', // Family Day
    '2024-03-29', // Good Friday
    '2024-05-20', // Victoria Day
    '2024-07-01', // Canada Day
    '2024-08-05', // Civic Holiday
    '2024-09-02', // Labour Day
    '2024-10-14', // Thanksgiving
    '2024-12-25', // Christmas Day
    '2024-12-26', // Boxing Day
];

router.get('/', (_req, res) => {
    res.json({
        success: true,
        holidays: ONTARIO_HOLIDAYS_2024
    });
});

export default router; 