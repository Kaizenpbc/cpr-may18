import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/errorHandler';
import { ApiResponseBuilder } from '../../utils/apiResponse';
import { AppError, errorCodes } from '../../utils/errorHandler';
import bcrypt from 'bcryptjs';
import pool from '../../config/database';
import { generateTokens } from '../../utils/jwtUtils';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = Router();

console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

// Protected routes
router.use('/dashboard', authenticateToken);

// Example route with error handling
router.get('/users', asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Implement actual user fetching
  res.json({
    success: true,
    data: {
      users: [
        { id: 1, username: 'testuser' }
      ]
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
}));

// Example route with error throwing
router.get(
  '/users/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Example of throwing a custom error
    if (!id) {
      throw new AppError(
        400,
        errorCodes.VALIDATION_ERROR,
        'User ID is required'
      );
    }

    // Example of using the standardized response
    const user = { id: 1, name: 'John Doe' };

    return res.json(
      ApiResponseBuilder.success(user, {
        version: '1.0.0',
      })
    );
  })
);

// Certifications routes
router.get('/certifications', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM certifications');
    return res.json(
      ApiResponseBuilder.success(result.rows, {
        version: '1.0.0',
      })
    );
  } catch (error: any) {
    console.error('Error fetching certifications:', error);
    throw new AppError(
      500,
      errorCodes.DB_QUERY_ERROR,
      'Failed to fetch certifications'
    );
  }
}));

router.get('/certifications/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new AppError(
      400,
      errorCodes.VALIDATION_ERROR,
      'Certification ID is required'
    );
  }

  try {
    const result = await pool.query('SELECT * FROM certifications WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new AppError(
        404,
        errorCodes.RESOURCE_NOT_FOUND,
        'Certification not found'
      );
    }
    return res.json(
      ApiResponseBuilder.success(result.rows[0], {
        version: '1.0.0',
      })
    );
  } catch (error: any) {
    console.error('Error fetching certification:', error);
    throw new AppError(
      500,
      errorCodes.DB_QUERY_ERROR,
      'Failed to fetch certification'
    );
  }
}));

// Dashboard route
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get upcoming classes count
    const upcomingClassesResult = await pool.query(
      'SELECT COUNT(*) FROM classes WHERE date >= CURRENT_DATE'
    );
    const upcomingClasses = parseInt(upcomingClassesResult.rows[0].count);

    // Get total students count
    const totalStudentsResult = await pool.query(
      'SELECT COUNT(*) FROM users WHERE role = \'student\''
    );
    const totalStudents = parseInt(totalStudentsResult.rows[0].count);

    // Get completed classes count
    const completedClassesResult = await pool.query(
      'SELECT COUNT(*) FROM classes WHERE date < CURRENT_DATE'
    );
    const completedClasses = parseInt(completedClassesResult.rows[0].count);

    // Get next class
    const nextClassResult = await pool.query(
      `SELECT 
        c.date,
        c.start_time as time,
        c.location,
        ct.name as type
      FROM classes c
      JOIN class_types ct ON c.type_id = ct.id
      WHERE c.date >= CURRENT_DATE
      ORDER BY c.date, c.start_time
      LIMIT 1`
    );
    const nextClass = nextClassResult.rows[0] || null;

    // Get recent classes
    const recentClassesResult = await pool.query(
      `SELECT 
        c.id,
        c.date,
        ct.name as type,
        COUNT(e.student_id) as students
      FROM classes c
      JOIN class_types ct ON c.type_id = ct.id
      LEFT JOIN enrollments e ON c.id = e.class_id
      WHERE c.date < CURRENT_DATE
      GROUP BY c.id, ct.name
      ORDER BY c.date DESC
      LIMIT 5`
    );

    const dashboardData = {
      upcomingClasses,
      totalStudents,
      completedClasses,
      nextClass: nextClass ? {
        date: nextClass.date,
        time: nextClass.time,
        location: nextClass.location,
        type: nextClass.type
      } : null,
      recentClasses: recentClassesResult.rows.map(row => ({
        id: row.id,
        date: row.date,
        type: row.type,
        students: parseInt(row.students)
      }))
    };

    return res.json(ApiResponseBuilder.success(dashboardData));
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch dashboard data');
  }
}));

// Schedule route
router.get('/schedule', authenticateToken, asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.date,
        c.start_time,
        c.end_time,
        c.location,
        c.status,
        c.max_students,
        c.current_students,
        ct.name as type,
        u.username as instructor_name,
        COUNT(e.student_id) as enrolled_students
      FROM classes c
      JOIN class_types ct ON c.type_id = ct.id
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN enrollments e ON c.id = e.class_id
      WHERE c.date >= CURRENT_DATE
      GROUP BY c.id, ct.name, u.username
      ORDER BY c.date ASC, c.start_time ASC
    `);

    const schedule = result.rows.map(row => ({
      id: row.id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      location: row.location,
      status: row.status,
      maxStudents: row.max_students,
      currentStudents: parseInt(row.enrolled_students),
      type: row.type,
      instructorName: row.instructor_name
    }));

    return res.json(ApiResponseBuilder.success(schedule));
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch schedule');
  }
}));

export default router; 