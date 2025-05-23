import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/errorHandler';
import { ApiResponseBuilder } from '../../utils/apiResponse';
import { AppError, errorCodes } from '../../utils/errorHandler';
import bcrypt from 'bcryptjs';
import { pool } from '../../config/database';
import { generateTokens } from '../../utils/jwtUtils';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = Router();

console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

// Protected routes
router.use('/dashboard', authenticateToken);
router.use('/organization', authenticateToken);
router.use('/courses', authenticateToken);
router.use('/instructors', authenticateToken);

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

// Course types endpoint
router.get('/course-types', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id as coursetypeid, name as coursetypename, description, duration_minutes FROM class_types ORDER BY name');
    return res.json(ApiResponseBuilder.success(result.rows));
  } catch (error: any) {
    console.error('Error fetching course types:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch course types');
  }
}));

// Organization course request endpoints
router.post('/organization/course-request', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { dateRequested, location, courseTypeId, registeredStudents, notes } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'User must be associated with an organization');
    }

    if (!dateRequested || !location || !courseTypeId || registeredStudents === undefined) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Missing required fields');
    }

    const result = await pool.query(
      `INSERT INTO course_requests 
       (organization_id, course_type_id, date_requested, location, registered_students, notes, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') 
       RETURNING *`,
      [organizationId, courseTypeId, dateRequested, location, registeredStudents, notes]
    );

    return res.json({
      success: true,
      message: 'Course request submitted successfully! Status: Pending',
      course: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating course request:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to create course request');
  }
}));

// Get organization's courses
router.get('/organization/courses', asyncHandler(async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'User must be associated with an organization');
    }

    const result = await pool.query(
      `SELECT 
        cr.id,
        cr.date_requested,
        cr.location,
        cr.registered_students,
        cr.notes,
        cr.status,
        cr.scheduled_date,
        cr.scheduled_start_time,
        cr.scheduled_end_time,
        cr.created_at,
        ct.name as course_type,
        u.username as instructor_name,
        o.name as organization_name
       FROM course_requests cr
       JOIN class_types ct ON cr.course_type_id = ct.id
       JOIN organizations o ON cr.organization_id = o.id
       LEFT JOIN users u ON cr.instructor_id = u.id
       WHERE cr.organization_id = $1
       ORDER BY cr.created_at DESC`,
      [organizationId]
    );

    return res.json(ApiResponseBuilder.success(result.rows));
  } catch (error: any) {
    console.error('Error fetching organization courses:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch courses');
  }
}));

// Course admin endpoints for managing course requests
router.get('/courses/pending', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        cr.id,
        cr.date_requested,
        cr.location,
        cr.registered_students,
        cr.notes,
        cr.status,
        cr.created_at,
        ct.name as course_type,
        o.name as organization_name
       FROM course_requests cr
       JOIN class_types ct ON cr.course_type_id = ct.id
       JOIN organizations o ON cr.organization_id = o.id
       WHERE cr.status = 'pending'
       ORDER BY cr.created_at ASC`
    );

    return res.json(ApiResponseBuilder.success(result.rows));
  } catch (error: any) {
    console.error('Error fetching pending courses:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch pending courses');
  }
}));

// Assign instructor to course request
router.put('/courses/:id/assign-instructor', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { instructorId, scheduledDate, startTime, endTime } = req.body;

    if (!instructorId) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Instructor ID is required');
    }

    // Update course request with instructor and mark as confirmed
    const result = await pool.query(
      `UPDATE course_requests 
       SET instructor_id = $1, 
           status = 'confirmed', 
           scheduled_date = $2,
           scheduled_start_time = $3,
           scheduled_end_time = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [instructorId, scheduledDate, startTime, endTime, id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course request not found');
    }

    return res.json({
      success: true,
      message: 'Instructor assigned successfully! Status updated to Confirmed.',
      course: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error assigning instructor:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to assign instructor');
  }
}));

// Get all instructors for assignment
router.get('/instructors', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE role = \'instructor\' ORDER BY username'
    );
    return res.json(ApiResponseBuilder.success(result.rows));
  } catch (error: any) {
    console.error('Error fetching instructors:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch instructors');
  }
}));

export default router; 