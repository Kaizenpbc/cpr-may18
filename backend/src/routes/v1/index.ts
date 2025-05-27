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

// Get available instructors for a specific date (needs to be before auth middleware)
router.get('/instructors/available/:date', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Date parameter is required');
    }

    console.log('[Available Instructors] Checking for date:', date);

    // Simple query: Get all instructors who have marked themselves available for this date
    const result = await pool.query(
      `SELECT DISTINCT
        u.id, 
        u.username as instructor_name, 
        u.email,
        u.first_name,
        u.last_name,
        'Available' as availability_status
       FROM users u
       INNER JOIN instructor_availability ia ON u.id = ia.instructor_id 
         AND ia.date::date = $1::date
         AND ia.status = 'available'
       WHERE u.role = 'instructor' 
         AND u.status = 'active'
       ORDER BY u.username`,
      [date]
    );
    
    console.log('[Available Instructors] Found:', result.rows.length, 'instructors for date:', date);
    console.log('[Available Instructors] Results:', result.rows);
    
    return res.json(ApiResponseBuilder.success(result.rows));
  } catch (error: any) {
    console.error('Error fetching available instructors:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch available instructors');
  }
}));

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
    const { scheduledDate, location, courseTypeId, registeredStudents, notes } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'User must be associated with an organization');
    }

    if (!scheduledDate || !location || !courseTypeId || registeredStudents === undefined) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Missing required fields');
    }

    const result = await pool.query(
      `INSERT INTO course_requests 
       (organization_id, course_type_id, date_requested, scheduled_date, location, registered_students, notes, status) 
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, 'pending') 
       RETURNING *`,
      [organizationId, courseTypeId, scheduledDate, location, registeredStudents, notes]
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
        cr.scheduled_date,
        cr.location,
        cr.registered_students,
        cr.notes,
        cr.status,
        cr.confirmed_date,
        cr.confirmed_start_time,
        cr.confirmed_end_time,
        cr.created_at,
        ct.name as course_type,
        u.username as instructor_name,
        o.name as organization_name,
        COALESCE(cs.student_count, 0) as actual_students,
        COALESCE(cs.attended_count, 0) as students_attended
       FROM course_requests cr
       JOIN class_types ct ON cr.course_type_id = ct.id
       JOIN organizations o ON cr.organization_id = o.id
       LEFT JOIN users u ON cr.instructor_id = u.id
       LEFT JOIN (
         SELECT 
           course_request_id, 
           COUNT(*) as student_count,
           COUNT(CASE WHEN attended = true THEN 1 END) as attended_count
         FROM course_students
         GROUP BY course_request_id
       ) cs ON cr.id = cs.course_request_id
       WHERE cr.organization_id = $1
       ORDER BY cr.created_at DESC`,
      [organizationId]
    );

    // Update registered_students with actual count if students have been uploaded
    const courses = result.rows.map(row => ({
      ...row,
      registered_students: row.actual_students > 0 ? row.actual_students : row.registered_students
    }));

    return res.json(ApiResponseBuilder.success(courses));
  } catch (error: any) {
    console.error('Error fetching organization courses:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch courses');
  }
}));

// Organization Analytics Endpoints

// Course Request Analytics
router.get('/organization/analytics/course-requests', asyncHandler(async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const { timeframe = '12' } = req.query; // Default to 12 months

    if (!organizationId) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'User must be associated with an organization');
    }

    // Request Volume Trends (Monthly)
    const volumeTrends = await pool.query(`
      WITH monthly_data AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', generate_series(
            CURRENT_DATE - INTERVAL '${timeframe} months',
            CURRENT_DATE,
            '1 month'
          )), 'YYYY-MM') as month,
          TO_CHAR(DATE_TRUNC('month', generate_series(
            CURRENT_DATE - INTERVAL '${timeframe} months',
            CURRENT_DATE,
            '1 month'
          )), 'Mon YYYY') as month_label
      )
      SELECT 
        md.month,
        md.month_label,
        COALESCE(COUNT(cr.id), 0) as request_count
      FROM monthly_data md
      LEFT JOIN course_requests cr ON TO_CHAR(DATE_TRUNC('month', cr.created_at), 'YYYY-MM') = md.month
        AND cr.organization_id = $1
      GROUP BY md.month, md.month_label
      ORDER BY md.month
    `, [organizationId]);

    // Course Type Preferences
    const courseTypePreferences = await pool.query(`
      SELECT 
        ct.name as course_type,
        COUNT(cr.id) as request_count,
        ROUND((COUNT(cr.id) * 100.0 / SUM(COUNT(cr.id)) OVER ()), 1) as percentage
      FROM course_requests cr
      JOIN class_types ct ON cr.course_type_id = ct.id
      WHERE cr.organization_id = $1
        AND cr.created_at >= CURRENT_DATE - INTERVAL '${timeframe} months'
      GROUP BY ct.name
      ORDER BY request_count DESC
    `, [organizationId]);

    // Seasonal Patterns (by month of year)
    const seasonalPatterns = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM cr.scheduled_date) as month_number,
        TO_CHAR(DATE_TRUNC('month', cr.scheduled_date), 'Month') as month_name,
        COUNT(cr.id) as request_count,
        AVG(EXTRACT(DAY FROM (cr.scheduled_date - cr.created_at::date))) as avg_lead_time_days
      FROM course_requests cr
      WHERE cr.organization_id = $1
        AND cr.created_at >= CURRENT_DATE - INTERVAL '${timeframe} months'
        AND cr.scheduled_date IS NOT NULL
      GROUP BY EXTRACT(MONTH FROM cr.scheduled_date), TO_CHAR(DATE_TRUNC('month', cr.scheduled_date), 'Month')
      ORDER BY month_number
    `, [organizationId]);

    // Lead Time Analysis
    const leadTimeAnalysis = await pool.query(`
      SELECT 
        CASE 
          WHEN EXTRACT(DAY FROM (cr.scheduled_date - cr.created_at::date)) <= 7 THEN '0-7 days'
          WHEN EXTRACT(DAY FROM (cr.scheduled_date - cr.created_at::date)) <= 14 THEN '8-14 days'
          WHEN EXTRACT(DAY FROM (cr.scheduled_date - cr.created_at::date)) <= 30 THEN '15-30 days'
          WHEN EXTRACT(DAY FROM (cr.scheduled_date - cr.created_at::date)) <= 60 THEN '31-60 days'
          ELSE '60+ days'
        END as lead_time_range,
        COUNT(cr.id) as request_count,
        ROUND(AVG(EXTRACT(DAY FROM (cr.scheduled_date - cr.created_at::date))), 1) as avg_days
      FROM course_requests cr
      WHERE cr.organization_id = $1
        AND cr.created_at >= CURRENT_DATE - INTERVAL '${timeframe} months'
        AND cr.scheduled_date IS NOT NULL
        AND cr.scheduled_date >= cr.created_at::date
      GROUP BY 
        CASE 
          WHEN EXTRACT(DAY FROM (cr.scheduled_date - cr.created_at::date)) <= 7 THEN '0-7 days'
          WHEN EXTRACT(DAY FROM (cr.scheduled_date - cr.created_at::date)) <= 14 THEN '8-14 days'
          WHEN EXTRACT(DAY FROM (cr.scheduled_date - cr.created_at::date)) <= 30 THEN '15-30 days'
          WHEN EXTRACT(DAY FROM (cr.scheduled_date - cr.created_at::date)) <= 60 THEN '31-60 days'
          ELSE '60+ days'
        END
      ORDER BY 
        CASE 
          WHEN lead_time_range = '0-7 days' THEN 1
          WHEN lead_time_range = '8-14 days' THEN 2
          WHEN lead_time_range = '15-30 days' THEN 3
          WHEN lead_time_range = '31-60 days' THEN 4
          ELSE 5
        END
    `, [organizationId]);

    return res.json(ApiResponseBuilder.success({
      volumeTrends: volumeTrends.rows,
      courseTypePreferences: courseTypePreferences.rows,
      seasonalPatterns: seasonalPatterns.rows,
      leadTimeAnalysis: leadTimeAnalysis.rows,
      timeframe: `${timeframe} months`
    }));
  } catch (error: any) {
    console.error('Error fetching course request analytics:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch course request analytics');
  }
}));

// Student Participation Analytics
router.get('/organization/analytics/student-participation', asyncHandler(async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const { timeframe = '12' } = req.query; // Default to 12 months

    if (!organizationId) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'User must be associated with an organization');
    }

    // Attendance Rates
    const attendanceRates = await pool.query(`
      SELECT 
        ct.name as course_type,
        COUNT(cs.id) as total_registered,
        COUNT(CASE WHEN cs.attended = true THEN 1 END) as total_attended,
        CASE 
          WHEN COUNT(cs.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN cs.attended = true THEN 1 END) * 100.0 / COUNT(cs.id)), 1)
          ELSE 0 
        END as attendance_rate
      FROM course_requests cr
      JOIN class_types ct ON cr.course_type_id = ct.id
      LEFT JOIN course_students cs ON cr.id = cs.course_request_id
      WHERE cr.organization_id = $1
        AND cr.created_at >= CURRENT_DATE - INTERVAL '${timeframe} months'
        AND cr.status = 'completed'
      GROUP BY ct.name
      ORDER BY attendance_rate DESC
    `, [organizationId]);

    // No-Show Patterns (Monthly trends)
    const noShowPatterns = await pool.query(`
      WITH monthly_attendance AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', cr.completed_at), 'YYYY-MM') as month,
          TO_CHAR(DATE_TRUNC('month', cr.completed_at), 'Mon YYYY') as month_label,
          COUNT(cs.id) as total_registered,
          COUNT(CASE WHEN cs.attended = true THEN 1 END) as total_attended,
          COUNT(CASE WHEN cs.attended = false OR cs.attended IS NULL THEN 1 END) as no_shows
        FROM course_requests cr
        LEFT JOIN course_students cs ON cr.id = cs.course_request_id
        WHERE cr.organization_id = $1
          AND cr.status = 'completed'
          AND cr.completed_at >= CURRENT_DATE - INTERVAL '${timeframe} months'
        GROUP BY DATE_TRUNC('month', cr.completed_at)
      )
      SELECT 
        month,
        month_label,
        total_registered,
        total_attended,
        no_shows,
        CASE 
          WHEN total_registered > 0 THEN 
            ROUND((no_shows * 100.0 / total_registered), 1)
          ELSE 0 
        END as no_show_rate
      FROM monthly_attendance
      WHERE month IS NOT NULL
      ORDER BY month
    `, [organizationId]);

    // Class Size Optimization
    const classSizeOptimization = await pool.query(`
      SELECT 
        cr.registered_students as requested_size,
        COUNT(cs.id) as actual_registered,
        COUNT(CASE WHEN cs.attended = true THEN 1 END) as actual_attended,
        CASE 
          WHEN COUNT(cs.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN cs.attended = true THEN 1 END) * 100.0 / COUNT(cs.id)), 1)
          ELSE 0 
        END as utilization_rate,
        COUNT(cr.id) as course_count
      FROM course_requests cr
      LEFT JOIN course_students cs ON cr.id = cs.course_request_id
      WHERE cr.organization_id = $1
        AND cr.created_at >= CURRENT_DATE - INTERVAL '${timeframe} months'
        AND cr.status = 'completed'
      GROUP BY cr.registered_students
      ORDER BY cr.registered_students
    `, [organizationId]);

    // Completion Rates by Course Type
    const completionRates = await pool.query(`
      SELECT 
        ct.name as course_type,
        COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) as completed_courses,
        COUNT(CASE WHEN cr.status = 'cancelled' THEN 1 END) as cancelled_courses,
        COUNT(cr.id) as total_courses,
        CASE 
          WHEN COUNT(cr.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) * 100.0 / COUNT(cr.id)), 1)
          ELSE 0 
        END as completion_rate,
        AVG(CASE WHEN cs.student_count > 0 THEN cs.attended_count * 100.0 / cs.student_count END) as avg_student_completion_rate
      FROM course_requests cr
      JOIN class_types ct ON cr.course_type_id = ct.id
      LEFT JOIN (
        SELECT 
          course_request_id,
          COUNT(*) as student_count,
          COUNT(CASE WHEN attended = true THEN 1 END) as attended_count
        FROM course_students
        GROUP BY course_request_id
      ) cs ON cr.id = cs.course_request_id
      WHERE cr.organization_id = $1
        AND cr.created_at >= CURRENT_DATE - INTERVAL '${timeframe} months'
      GROUP BY ct.name
      ORDER BY completion_rate DESC
    `, [organizationId]);

    // Overall Summary Stats
    const summaryStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT cr.id) as total_courses_requested,
        COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) as total_courses_completed,
        COUNT(CASE WHEN cr.status = 'cancelled' THEN 1 END) as total_courses_cancelled,
        COALESCE(SUM(cs.student_count), 0) as total_students_registered,
        COALESCE(SUM(cs.attended_count), 0) as total_students_attended,
        CASE 
          WHEN SUM(cs.student_count) > 0 THEN 
            ROUND((SUM(cs.attended_count) * 100.0 / SUM(cs.student_count)), 1)
          ELSE 0 
        END as overall_attendance_rate
      FROM course_requests cr
      LEFT JOIN (
        SELECT 
          course_request_id,
          COUNT(*) as student_count,
          COUNT(CASE WHEN attended = true THEN 1 END) as attended_count
        FROM course_students
        GROUP BY course_request_id
      ) cs ON cr.id = cs.course_request_id
      WHERE cr.organization_id = $1
        AND cr.created_at >= CURRENT_DATE - INTERVAL '${timeframe} months'
    `, [organizationId]);

    return res.json(ApiResponseBuilder.success({
      attendanceRates: attendanceRates.rows,
      noShowPatterns: noShowPatterns.rows,
      classSizeOptimization: classSizeOptimization.rows,
      completionRates: completionRates.rows,
      summaryStats: summaryStats.rows[0],
      timeframe: `${timeframe} months`
    }));
  } catch (error: any) {
    console.error('Error fetching student participation analytics:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch student participation analytics');
  }
}));

// Course admin endpoints for managing course requests
router.get('/courses/pending', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        cr.id,
        cr.date_requested,
        cr.scheduled_date,
        cr.location,
        cr.registered_students,
        cr.notes,
        cr.status,
        cr.created_at,
        ct.name as course_type,
        o.name as organization_name,
        u.username as instructor_name
       FROM course_requests cr
       JOIN class_types ct ON cr.course_type_id = ct.id
       JOIN organizations o ON cr.organization_id = o.id
       LEFT JOIN users u ON cr.instructor_id = u.id
       WHERE cr.status = 'pending'
       ORDER BY cr.created_at ASC`
    );

    return res.json(ApiResponseBuilder.success(result.rows));
  } catch (error: any) {
    console.error('Error fetching pending courses:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch pending courses');
  }
}));

// Get confirmed courses
router.get('/courses/confirmed', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        cr.id,
        cr.date_requested,
        cr.scheduled_date,
        cr.location,
        cr.registered_students,
        cr.notes,
        cr.status,
        cr.confirmed_date,
        cr.confirmed_start_time,
        cr.confirmed_end_time,
        cr.created_at,
        ct.name as course_type,
        o.name as organization_name,
        u.username as instructor_name,
        COALESCE(cs.student_count, 0) as actual_students,
        COALESCE(cs.attended_count, 0) as students_attended
       FROM course_requests cr
       JOIN class_types ct ON cr.course_type_id = ct.id
       JOIN organizations o ON cr.organization_id = o.id
       LEFT JOIN users u ON cr.instructor_id = u.id
       LEFT JOIN (
         SELECT 
           course_request_id, 
           COUNT(*) as student_count,
           COUNT(CASE WHEN attended = true THEN 1 END) as attended_count
         FROM course_students
         GROUP BY course_request_id
       ) cs ON cr.id = cs.course_request_id
       WHERE cr.status = 'confirmed'
       ORDER BY cr.confirmed_date ASC, cr.confirmed_start_time ASC`
    );

    // Update registered_students with actual count if students have been uploaded
    const courses = result.rows.map(row => ({
      ...row,
      registered_students: row.actual_students > 0 ? row.actual_students : row.registered_students
    }));

    return res.json(ApiResponseBuilder.success(courses));
  } catch (error: any) {
    console.error('Error fetching confirmed courses:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch confirmed courses');
  }
}));

// Get completed courses
router.get('/courses/completed', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        cr.id,
        cr.date_requested,
        cr.scheduled_date,
        cr.location,
        cr.registered_students,
        cr.notes,
        cr.status,
        cr.confirmed_date,
        cr.confirmed_start_time,
        cr.confirmed_end_time,
        cr.completed_at,
        cr.created_at,
        cr.ready_for_billing,
        cr.ready_for_billing_at,
        ct.name as course_type,
        o.name as organization_name,
        u.username as instructor_name,
        COALESCE(cs.student_count, 0) as actual_students,
        COALESCE(cs.attended_count, 0) as students_attended
       FROM course_requests cr
       JOIN class_types ct ON cr.course_type_id = ct.id
       JOIN organizations o ON cr.organization_id = o.id
       LEFT JOIN users u ON cr.instructor_id = u.id
       LEFT JOIN (
         SELECT 
           course_request_id, 
           COUNT(*) as student_count,
           COUNT(CASE WHEN attended = true THEN 1 END) as attended_count
         FROM course_students
         GROUP BY course_request_id
       ) cs ON cr.id = cs.course_request_id
       WHERE cr.status = 'completed'
       ORDER BY cr.completed_at DESC`
    );

    // Update registered_students with actual count if students have been uploaded
    const courses = result.rows.map(row => ({
      ...row,
      registered_students: row.actual_students > 0 ? row.actual_students : row.registered_students
    }));

    return res.json(ApiResponseBuilder.success(courses));
  } catch (error: any) {
    console.error('Error fetching completed courses:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch completed courses');
  }
}));

// Cancel a course request
router.put('/courses/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason?.trim()) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Cancellation reason is required');
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update course request status to cancelled and add reason to notes
      const courseUpdateResult = await client.query(
        `UPDATE course_requests 
         SET status = 'cancelled', 
             notes = CASE 
               WHEN notes IS NULL OR notes = '' THEN $2
               ELSE notes || E'\n\n[CANCELLED] ' || $2
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 
         RETURNING *`,
        [id, reason]
      );

      if (courseUpdateResult.rows.length === 0) {
        throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course request not found');
      }

      const courseRequest = courseUpdateResult.rows[0];

      // If instructor was assigned, remove the corresponding class and restore availability
      if (courseRequest.instructor_id && courseRequest.confirmed_date) {
        // Remove the class from instructor's schedule
        await client.query(
          `DELETE FROM classes 
           WHERE instructor_id = $1 AND date = $2`,
          [courseRequest.instructor_id, courseRequest.confirmed_date]
        );

        // Restore instructor availability for that date
        await client.query(
          `INSERT INTO instructor_availability (instructor_id, date, status)
           VALUES ($1, $2, 'available')
           ON CONFLICT (instructor_id, date) DO UPDATE SET status = 'available'`,
          [courseRequest.instructor_id, courseRequest.confirmed_date]
        );
      }

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: 'Course cancelled successfully',
        course: courseRequest
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error cancelling course:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to cancel course');
  }
}));

// Update course schedule (reschedule)
router.put('/courses/:id/schedule', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledDate, startTime, endTime, instructorId } = req.body;

    if (!scheduledDate) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Scheduled date is required');
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current course data
      const currentCourseResult = await client.query(
        'SELECT * FROM course_requests WHERE id = $1',
        [id]
      );

      if (currentCourseResult.rows.length === 0) {
        throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course request not found');
      }

      const currentCourse = currentCourseResult.rows[0];

      // Update course request with new schedule and optionally new instructor
      const updateFields = ['confirmed_date = $2', 'updated_at = CURRENT_TIMESTAMP'];
      const updateValues = [id, scheduledDate];
      let paramIndex = 3;

      if (startTime) {
        updateFields.push(`confirmed_start_time = $${paramIndex}`);
        updateValues.push(startTime);
        paramIndex++;
      }

      if (endTime) {
        updateFields.push(`confirmed_end_time = $${paramIndex}`);
        updateValues.push(endTime);
        paramIndex++;
      }

      if (instructorId && instructorId !== currentCourse.instructor_id) {
        updateFields.push(`instructor_id = $${paramIndex}`);
        updateValues.push(instructorId);
        paramIndex++;
      }

      const courseUpdateResult = await client.query(
        `UPDATE course_requests 
         SET ${updateFields.join(', ')}
         WHERE id = $1 
         RETURNING *`,
        updateValues
      );

      const updatedCourse = courseUpdateResult.rows[0];

      // If instructor changed or schedule changed, update classes table
      if (currentCourse.instructor_id) {
        // Remove old class entry
        await client.query(
          `DELETE FROM classes 
           WHERE instructor_id = $1 AND date = $2`,
          [currentCourse.instructor_id, currentCourse.confirmed_date]
        );

        // Restore old instructor's availability
        await client.query(
          `INSERT INTO instructor_availability (instructor_id, date, status)
           VALUES ($1, $2, 'available')
           ON CONFLICT (instructor_id, date) DO UPDATE SET status = 'available'`,
          [currentCourse.instructor_id, currentCourse.confirmed_date]
        );
      }

      // Create new class entry for the updated course
      if (updatedCourse.instructor_id) {
        await client.query(
          `INSERT INTO classes (
            instructor_id, 
            type_id, 
            date, 
            start_time, 
            end_time, 
            location, 
            max_students, 
            current_students,
            status,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'scheduled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            updatedCourse.instructor_id,
            updatedCourse.course_type_id,
            updatedCourse.confirmed_date,
            updatedCourse.confirmed_start_time || startTime,
            updatedCourse.confirmed_end_time || endTime,
            updatedCourse.location,
            updatedCourse.registered_students
          ]
        );

        // Remove instructor's availability for the new scheduled date
        await client.query(
          `DELETE FROM instructor_availability 
           WHERE instructor_id = $1 AND date = $2`,
          [updatedCourse.instructor_id, updatedCourse.confirmed_date]
        );
      }

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: 'Course schedule updated successfully',
        course: updatedCourse
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error updating course schedule:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to update course schedule');
  }
}));

// Assign instructor to course request
router.put('/courses/:id/assign-instructor', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { instructorId, startTime, endTime } = req.body;

    if (!instructorId) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Instructor ID is required');
    }

    // Start a transaction to ensure both operations succeed or fail together
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update course request with instructor and mark as confirmed
      // Use CURRENT_DATE for confirmed_date (when admin assigns the instructor)
      const courseUpdateResult = await client.query(
        `UPDATE course_requests 
         SET instructor_id = $1, 
             status = 'confirmed', 
             confirmed_date = CURRENT_DATE,
             confirmed_start_time = $2,
             confirmed_end_time = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 
         RETURNING *`,
        [instructorId, startTime, endTime, id]
      );

      if (courseUpdateResult.rows.length === 0) {
        throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course request not found');
      }

      const courseRequest = courseUpdateResult.rows[0];

      // Create corresponding entry in classes table so instructor can see it in "My Classes"
      // Use the scheduled_date from the course request (when org wants the course)
      const classInsertResult = await client.query(
        `INSERT INTO classes (
          instructor_id, 
          type_id, 
          date, 
          start_time, 
          end_time, 
          location, 
          max_students, 
          current_students,
          status,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'scheduled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          instructorId,
          courseRequest.course_type_id,
          courseRequest.scheduled_date,  // Use the scheduled_date from course request
          startTime,
          endTime,
          courseRequest.location,
          courseRequest.registered_students // Use requested students as max capacity
        ]
      );

      // Note: We're not removing availability anymore to allow multiple assignments per day
      // This allows instructors to handle multiple courses on the same day if needed
      
      // Optionally, you could track assignments differently:
      // await client.query(
      //   `DELETE FROM instructor_availability 
      //    WHERE instructor_id = $1 AND date = $2`,
      //   [instructorId, courseRequest.scheduled_date]
      // );

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: 'Instructor assigned successfully! Course status updated to Confirmed and added to instructor schedule.',
        course: courseRequest,
        class: classInsertResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error assigning instructor:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to assign instructor');
  }
}));

// Get all instructors for assignment
router.get('/instructors', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id, 
        u.username as instructor_name, 
        u.email,
        COALESCE(ia.date::text, 'No availability set') as availability_date,
        COALESCE(ia.status, 'no_availability') as availability_status,
        COALESCE(cr.notes, '') as notes,
        CASE 
          WHEN cr.id IS NOT NULL AND cr.confirmed_date::date = ia.date::date AND cr.status = 'confirmed' THEN 'Confirmed'
          WHEN cr.id IS NOT NULL AND cr.confirmed_date::date = ia.date::date AND cr.status = 'completed' THEN 'Completed'
          WHEN ia.status = 'completed' THEN 'Completed'
          WHEN ia.status = 'available' THEN 'Available'
          WHEN ia.date IS NOT NULL THEN 'Available'
          ELSE 'No availability'
        END as assignment_status,
        COALESCE(o.name, '') as assigned_organization,
        COALESCE(cr.location, '') as assigned_location,
        COALESCE(ct.name, '') as assigned_course_type
       FROM users u
       LEFT JOIN instructor_availability ia ON u.id = ia.instructor_id 
         AND ia.date >= CURRENT_DATE
       LEFT JOIN course_requests cr ON u.id = cr.instructor_id 
         AND cr.confirmed_date::date = ia.date::date
         AND cr.status IN ('confirmed', 'completed')
       LEFT JOIN organizations o ON cr.organization_id = o.id
       LEFT JOIN class_types ct ON cr.course_type_id = ct.id
       WHERE u.role = 'instructor' 
       ORDER BY u.username, ia.date`
    );
    return res.json(ApiResponseBuilder.success(result.rows));
  } catch (error: any) {
    console.error('Error fetching instructors:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch instructors');
  }
}));



// Student Management Endpoints

// Get students for a specific course (for organizations)
router.get('/organization/courses/:courseId/students', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'User must be associated with an organization');
    }

    // Verify the course belongs to this organization
    const courseCheck = await pool.query(
      'SELECT id FROM course_requests WHERE id = $1 AND organization_id = $2',
      [courseId, organizationId]
    );

    if (courseCheck.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course not found or not authorized');
    }

    // Get students for this course with attendance information
    const result = await pool.query(
      `SELECT 
        s.id,
        s.course_request_id,
        s.first_name,
        s.last_name,
        s.email,
        s.attended,
        s.attendance_marked,
        s.created_at
       FROM course_students s
       WHERE s.course_request_id = $1
       ORDER BY s.last_name, s.first_name`,
      [courseId]
    );

    return res.json(ApiResponseBuilder.success(result.rows));
  } catch (error: any) {
    console.error('Error fetching course students:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch course students');
  }
}));

// Upload students for a specific course (for organizations)
router.post('/organization/courses/:courseId/students', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { students } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'User must be associated with an organization');
    }

    if (!students || !Array.isArray(students) || students.length === 0) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Students array is required and must not be empty');
    }

    // Verify the course belongs to this organization
    const courseCheck = await pool.query(
      'SELECT id FROM course_requests WHERE id = $1 AND organization_id = $2',
      [courseId, organizationId]
    );

    if (courseCheck.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course not found or not authorized');
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // First, delete existing students for this course (replace operation)
      await client.query(
        'DELETE FROM course_students WHERE course_request_id = $1',
        [courseId]
      );

      // Insert new students
      let insertedCount = 0;
      for (const student of students) {
        const { firstName, lastName, email } = student;
        
        if (!firstName || !lastName) {
          continue; // Skip invalid entries
        }

        await client.query(
          `INSERT INTO course_students (course_request_id, first_name, last_name, email)
           VALUES ($1, $2, $3, $4)`,
          [courseId, firstName.trim(), lastName.trim(), email?.trim() || null]
        );
        insertedCount++;
      }

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: `Successfully uploaded ${insertedCount} students to the course.`,
        data: { studentsUploaded: insertedCount }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error uploading course students:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to upload course students');
  }
}));

// Admin endpoints to view specific instructor data
router.get('/instructors/:id/schedule', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.id, c.date::text, c.start_time::text, c.end_time::text, c.status, c.location, 
              ct.name as type, c.max_students, c.current_students 
       FROM classes c 
       LEFT JOIN class_types ct ON c.type_id = ct.id 
       WHERE c.instructor_id = $1 AND c.date >= CURRENT_DATE 
       ORDER BY c.date, c.start_time`,
      [id]
    );
    
    const schedule = result.rows.map(row => ({
      id: row.id.toString(),
      type: row.type || 'CPR Class',
      date: row.date.split('T')[0],
      time: row.start_time ? row.start_time.slice(0, 5) : '09:00',
      location: row.location || 'TBD',
      max_students: row.max_students || 10,
      current_students: row.current_students || 0,
      status: row.status || 'scheduled'
    }));

    return res.json(ApiResponseBuilder.success(schedule));
  } catch (error: any) {
    console.error('Error fetching instructor schedule:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch instructor schedule');
  }
}));

router.get('/instructors/:id/availability', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, instructor_id, date::text, status, created_at, updated_at FROM instructor_availability WHERE instructor_id = $1 AND date >= CURRENT_DATE ORDER BY date',
      [id]
    );
    
    const availability = result.rows.map(row => ({
      id: row.id.toString(),
      instructor_id: row.instructor_id.toString(),
      date: row.date.split('T')[0],
      status: row.status || 'available'
    }));

    return res.json(ApiResponseBuilder.success(availability));
  } catch (error: any) {
    console.error('Error fetching instructor availability:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch instructor availability');
  }
}));

// Get instructor statistics for dashboard
router.get('/admin/instructor-stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { month } = req.query; // Format: YYYY-MM
    
    // If month is provided, filter by that month, otherwise get all-time stats
    let dateFilter = '';
    let params: any[] = [];
    
    if (month) {
      const startDate = `${month}-01`;
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
        .toISOString().split('T')[0];
      dateFilter = `AND (cr.confirmed_date IS NULL OR (cr.confirmed_date >= $1 AND cr.confirmed_date <= $2))`;
      params = [startDate, endDate];
    }

    const result = await pool.query(
      `SELECT 
        u.id as instructor_id,
        u.username as instructor_name,
        u.email,
        COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) as courses_completed,
        COUNT(CASE WHEN cr.status = 'confirmed' THEN 1 END) as courses_scheduled,
        COUNT(cr.id) as total_courses,
        CASE 
          WHEN COUNT(CASE WHEN cr.status = 'confirmed' THEN 1 END) > 0 THEN
            ROUND((COUNT(CASE WHEN cr.status = 'completed' THEN 1 END)::DECIMAL / 
                   COUNT(CASE WHEN cr.status = 'confirmed' THEN 1 END)) * 100, 1)
          ELSE 0
        END as completion_rate,
        MAX(cr.completed_at)::date as last_course_date,
        CASE 
          WHEN COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) > 0 THEN
            ROUND(AVG(CASE WHEN cr.status = 'completed' THEN cr.registered_students END), 1)
          ELSE 0
        END as avg_students_per_course
       FROM users u
       LEFT JOIN course_requests cr ON u.id = cr.instructor_id ${dateFilter}
       WHERE u.role = 'instructor'
       GROUP BY u.id, u.username, u.email
       ORDER BY u.username`,
      params
    );
    
    return res.json(ApiResponseBuilder.success(result.rows));
  } catch (error: any) {
    console.error('Error fetching instructor statistics:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch instructor statistics');
  }
}));

// Delete instructor availability for a specific date (admin only)
router.delete('/instructors/:instructorId/availability/:date', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { instructorId, date } = req.params;
    
    if (!instructorId || !date) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Instructor ID and date are required');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First, check if there are any confirmed courses for this instructor on this date
      const confirmedCoursesCheck = await client.query(
        `SELECT id FROM course_requests 
         WHERE instructor_id = $1 
         AND confirmed_date::date = $2::date 
         AND status = 'confirmed'`,
        [instructorId, date]
      );

      if (confirmedCoursesCheck.rows.length > 0) {
        throw new AppError(400, errorCodes.VALIDATION_ERROR, 
          'Cannot remove availability: Instructor has confirmed courses on this date. Please reassign or cancel the courses first.');
      }

      // Delete from instructor_availability
      const deleteAvailabilityResult = await client.query(
        'DELETE FROM instructor_availability WHERE instructor_id = $1 AND date::date = $2::date RETURNING *',
        [instructorId, date]
      );

      // Also delete any scheduled (not confirmed) classes for this date
      const deleteClassesResult = await client.query(
        `DELETE FROM classes 
         WHERE instructor_id = $1 
         AND date::date = $2::date 
         AND status = 'scheduled'
         RETURNING *`,
        [instructorId, date]
      );

      await client.query('COMMIT');

      return res.json(ApiResponseBuilder.success({
        message: 'Availability removed successfully',
        deletedAvailability: deleteAvailabilityResult.rows.length,
        deletedClasses: deleteClassesResult.rows.length
      }));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error removing instructor availability:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to remove instructor availability');
  }
}));

// Get dashboard summary for the month
router.get('/admin/dashboard-summary', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { month } = req.query; // Format: YYYY-MM
    
    if (!month) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Month parameter is required (format: YYYY-MM)');
    }

    // Parse the month to get start and end dates
    const startDate = `${month}-01`;
    const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
      .toISOString().split('T')[0];

    const summaryResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT u.id) as total_instructors,
        COUNT(cr.id) as total_courses_this_month,
        COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) as total_completed_this_month,
        CASE 
          WHEN COUNT(DISTINCT u.id) > 0 THEN 
            ROUND(COUNT(cr.id)::DECIMAL / COUNT(DISTINCT u.id), 1)
          ELSE 0 
        END as avg_courses_per_instructor
      FROM users u
      LEFT JOIN course_requests cr ON u.id = cr.instructor_id 
        AND cr.confirmed_date >= $1 
        AND cr.confirmed_date <= $2
      WHERE u.role = 'instructor'`,
      [startDate, endDate]
    );

    res.json({
      success: true,
      data: summaryResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
}));

router.get('/admin/logs', asyncHandler(async (req: Request, res: Response) => {
  // Implementation of getting logs
  // This is a placeholder and should be replaced with the actual implementation
  res.json({
    success: true,
    data: []
  });
}));

// Accounting Portal Endpoints

// Get accounting dashboard data
router.get('/accounting/dashboard', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Monthly Revenue
    const monthlyRevenue = await pool.query(`
      SELECT COALESCE(SUM(p.amount), 0) as total_revenue
      FROM payments p
      WHERE EXTRACT(MONTH FROM p.payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM p.payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    // Outstanding Invoices
    const outstandingInvoices = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
      FROM invoices
      WHERE status = 'pending'
    `);

    // Payments This Month
    const paymentsThisMonth = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
      FROM payments
      WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    // Completed Courses This Month (for instructor payments)
    const completedCoursesThisMonth = await pool.query(`
      SELECT COUNT(*) as completed_courses
      FROM course_requests
      WHERE status = 'completed'
      AND EXTRACT(MONTH FROM completed_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM completed_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    const dashboardData = {
      monthlyRevenue: Number(monthlyRevenue.rows[0]?.total_revenue || 0),
      outstandingInvoices: {
        count: parseInt(outstandingInvoices.rows[0]?.count || 0),
        amount: Number(outstandingInvoices.rows[0]?.total_amount || 0)
      },
      paymentsThisMonth: {
        count: parseInt(paymentsThisMonth.rows[0]?.count || 0),
        amount: Number(paymentsThisMonth.rows[0]?.total_amount || 0)
      },
      completedCoursesThisMonth: parseInt(completedCoursesThisMonth.rows[0]?.completed_courses || 0)
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching accounting dashboard:', error);
    throw error;
  }
}));

// Get course pricing for all organizations
router.get('/accounting/course-pricing', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        cp.id,
        cp.organization_id,
        cp.course_type_id,
        cp.price_per_student,
        cp.effective_date,
        cp.is_active,
        o.name as organization_name,
        ct.name as course_type_name,
        ct.description as course_description
      FROM course_pricing cp
      JOIN organizations o ON cp.organization_id = o.id
      JOIN class_types ct ON cp.course_type_id = ct.id
      WHERE cp.is_active = true
      ORDER BY o.name, ct.name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching course pricing:', error);
    throw error;
  }
}));

// Update course pricing
router.put('/accounting/course-pricing/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { price_per_student } = req.body;

    if (!price_per_student || price_per_student <= 0) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Valid price per student is required');
    }

    const result = await pool.query(`
      UPDATE course_pricing 
      SET price_per_student = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
      RETURNING *
    `, [price_per_student, id]);

    if (result.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course pricing record not found');
    }

    res.json({
      success: true,
      message: 'Course pricing updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating course pricing:', error);
    throw error;
  }
}));

// Get organizations list for pricing setup
router.get('/accounting/organizations', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, name, contact_email, contact_phone
      FROM organizations
      ORDER BY name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
}));

// Get course types for pricing setup
router.get('/accounting/course-types', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, duration_minutes
      FROM class_types
      ORDER BY name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching course types:', error);
    throw error;
  }
}));

// Create new course pricing
router.post('/accounting/course-pricing', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { organization_id, course_type_id, price_per_student } = req.body;

    if (!organization_id || !course_type_id || !price_per_student || price_per_student <= 0) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'All fields are required and price must be greater than 0');
    }

    // Check if pricing already exists for this combination
    const existingResult = await pool.query(`
      SELECT id FROM course_pricing
      WHERE organization_id = $1 AND course_type_id = $2 AND is_active = true
    `, [organization_id, course_type_id]);

    if (existingResult.rows.length > 0) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Pricing already exists for this organization/course type combination');
    }

    const result = await pool.query(`
      INSERT INTO course_pricing (organization_id, course_type_id, price_per_student, effective_date, is_active)
      VALUES ($1, $2, $3, CURRENT_DATE, true)
      RETURNING *
    `, [organization_id, course_type_id, price_per_student]);

    res.json({
      success: true,
      message: 'Course pricing created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating course pricing:', error);
    throw error;
  }
}));

// Get billing queue (completed courses ready for invoicing)
router.get('/accounting/billing-queue', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        cr.id as course_id,
        cr.organization_id,
        o.name as organization_name,
        o.contact_email,
        ct.name as course_type_name,
        cr.location,
        cr.completed_at::date as date_completed,
        cr.registered_students,
        (SELECT COUNT(*) FROM course_students cs WHERE cs.course_request_id = cr.id) as students_attended,
        COALESCE(cp.price_per_student, 50.00) as rate_per_student,
        (SELECT COUNT(*) FROM course_students cs WHERE cs.course_request_id = cr.id) * COALESCE(cp.price_per_student, 50.00) as total_amount,
        u.username as instructor_name,
        cr.ready_for_billing_at
      FROM course_requests cr
      JOIN organizations o ON cr.organization_id = o.id
      JOIN class_types ct ON cr.course_type_id = ct.id
      LEFT JOIN course_pricing cp ON cr.organization_id = cp.organization_id AND cr.course_type_id = cp.course_type_id AND cp.is_active = true
      LEFT JOIN users u ON cr.instructor_id = u.id
      WHERE cr.status = 'completed'
      AND cr.ready_for_billing = true
      AND cr.id NOT IN (SELECT course_id FROM invoices WHERE course_id IS NOT NULL)
      ORDER BY cr.ready_for_billing_at DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching billing queue:', error);
    throw error;
  }
}));

// Create invoice from completed course
router.post('/accounting/invoices', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Course ID is required');
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get course details
      const courseResult = await client.query(`
        SELECT 
          cr.id,
          cr.organization_id,
          cr.completed_at,
          cr.location,
          o.name as organization_name,
          o.contact_email,
          ct.name as course_type_name,
          (SELECT COUNT(*) FROM course_students cs WHERE cs.course_request_id = cr.id) as students_attended,
          COALESCE(cp.price_per_student, 50.00) as rate_per_student
        FROM course_requests cr
        JOIN organizations o ON cr.organization_id = o.id
        JOIN class_types ct ON cr.course_type_id = ct.id
        LEFT JOIN course_pricing cp ON cr.organization_id = cp.organization_id AND cr.course_type_id = cp.course_type_id AND cp.is_active = true
        WHERE cr.id = $1 AND cr.status = 'completed'
      `, [courseId]);

      if (courseResult.rows.length === 0) {
        throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course not found or not completed');
      }

      const course = courseResult.rows[0];
      const totalAmount = course.students_attended * course.rate_per_student;

      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Create invoice
      const invoiceResult = await client.query(`
        INSERT INTO invoices (
          invoice_number,
          course_id,
          organization_id,
          invoice_date,
          due_date,
          amount,
          status,
          course_type_name,
          location,
          date_completed,
          students_attendance,
          rate_per_student
        )
        VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $4, 'pending', $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        invoiceNumber,
        courseId,
        course.organization_id,
        totalAmount,
        course.course_type_name,
        course.location,
        course.completed_at,
        course.students_attended,
        course.rate_per_student
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Invoice created successfully',
        data: invoiceResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}));

// Get all invoices
router.get('/accounting/invoices', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.id as invoice_id,
        i.invoice_number,
        i.course_id,
        i.organization_id,
        i.invoice_date,
        i.due_date,
        i.amount,
        i.status,
        i.course_type_name,
        i.location,
        i.date_completed,
        i.students_attendance,
        i.rate_per_student,
        i.notes,
        i.email_sent_at,
        o.name as organization_name,
        o.contact_email,
        COALESCE(SUM(p.amount), 0) as paid_to_date,
        i.amount - COALESCE(SUM(p.amount), 0) as balance_due,
        CASE 
          WHEN i.amount - COALESCE(SUM(p.amount), 0) <= 0 THEN 'paid'
          WHEN CURRENT_DATE > i.due_date THEN 'overdue'
          ELSE 'pending'
        END as payment_status,
        CASE 
          WHEN CURRENT_DATE <= i.due_date THEN 'current'
          WHEN CURRENT_DATE <= i.due_date + INTERVAL '30 days' THEN '1-30 days'
          WHEN CURRENT_DATE <= i.due_date + INTERVAL '60 days' THEN '31-60 days'
          WHEN CURRENT_DATE <= i.due_date + INTERVAL '90 days' THEN '61-90 days'
          ELSE '90+ days'
        END as aging_bucket
      FROM invoices i
      JOIN organizations o ON i.organization_id = o.id
      LEFT JOIN payments p ON i.id = p.invoice_id
      GROUP BY i.id, i.invoice_number, i.course_id, i.organization_id, i.invoice_date, 
               i.due_date, i.amount, i.status, i.course_type_name, i.location, 
               i.date_completed, i.students_attendance, i.rate_per_student, i.notes, 
               i.email_sent_at, o.name, o.contact_email
      ORDER BY i.invoice_date DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
}));

// Get specific invoice details
router.get('/accounting/invoices/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        i.*,
        o.name as organization_name,
        o.contact_email,
        o.contact_name,
        o.address_street,
        o.address_city,
        o.address_province,
        o.address_postal_code
      FROM invoices i
      JOIN organizations o ON i.organization_id = o.id
      WHERE i.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Invoice not found');
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    throw error;
  }
}));

// Update invoice
router.put('/accounting/invoices/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, due_date, status, notes } = req.body;

    const result = await pool.query(`
      UPDATE invoices 
      SET amount = COALESCE($1, amount),
          due_date = COALESCE($2, due_date),
          status = COALESCE($3, status),
          notes = COALESCE($4, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [amount, due_date, status, notes, id]);

    if (result.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Invoice not found');
    }

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
}));

// Send invoice email
router.post('/accounting/invoices/:id/email', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Update email sent timestamp
    await pool.query(`
      UPDATE invoices 
      SET email_sent_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    // Here you would integrate with your email service
    // For now, we'll just simulate success
    
    res.json({
      success: true,
      message: 'Invoice email sent successfully',
      previewUrl: `http://localhost:3001/api/v1/accounting/invoices/${id}/preview` // For testing
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
}));

// Get invoice payments
router.get('/accounting/invoices/:id/payments', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        p.id,
        p.invoice_id,
        p.amount as amount_paid,
        p.payment_date,
        p.payment_method,
        p.reference_number,
        p.notes,
        p.created_at
      FROM payments p
      WHERE p.invoice_id = $1
      ORDER BY p.payment_date DESC
    `, [id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching invoice payments:', error);
    throw error;
  }
}));

// Record payment for invoice
router.post('/accounting/invoices/:id/payments', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount_paid, payment_date, payment_method, reference_number, notes } = req.body;

    if (!amount_paid || amount_paid <= 0) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Valid payment amount is required');
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Record the payment
      const paymentResult = await client.query(`
        INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference_number, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [id, amount_paid, payment_date || new Date(), payment_method, reference_number, notes]);

      // Update invoice status if fully paid
      const invoiceResult = await client.query(`
        SELECT amount, (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = $1) as total_paid
        FROM invoices WHERE id = $1
      `, [id]);

      const invoice = invoiceResult.rows[0];
      if (invoice && invoice.total_paid >= invoice.amount) {
        await client.query(`
          UPDATE invoices SET status = 'paid' WHERE id = $1
        `, [id]);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Payment recorded successfully',
        data: paymentResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
}));

// Revenue report endpoint
router.get('/accounting/reports/revenue', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { year } = req.query;

    if (!year) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Year parameter is required');
    }

    const result = await pool.query(`
      WITH monthly_data AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', generate_series(
            DATE_TRUNC('year', $1::date),
            DATE_TRUNC('year', $1::date) + INTERVAL '11 months',
            '1 month'
          )), 'YYYY-MM') as month,
          0 as default_value
      ),
      invoices_by_month AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', invoice_date), 'YYYY-MM') as month,
          COALESCE(SUM(amount), 0) as total_invoiced
        FROM invoices
        WHERE EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM $1::date)
        GROUP BY TO_CHAR(DATE_TRUNC('month', invoice_date), 'YYYY-MM')
      ),
      payments_by_month AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', payment_date), 'YYYY-MM') as month,
          COALESCE(SUM(amount), 0) as total_paid_in_month
        FROM payments
        WHERE EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM $1::date)
        GROUP BY TO_CHAR(DATE_TRUNC('month', payment_date), 'YYYY-MM')
      )
      SELECT 
        md.month,
        COALESCE(ibm.total_invoiced, 0) as total_invoiced,
        COALESCE(pbm.total_paid_in_month, 0) as total_paid_in_month,
        0 as balance_brought_forward -- Simplified for now
      FROM monthly_data md
      LEFT JOIN invoices_by_month ibm ON md.month = ibm.month
      LEFT JOIN payments_by_month pbm ON md.month = pbm.month
      ORDER BY md.month
    `, [year]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error generating revenue report:', error);
    throw error;
  }
}));

// ===========================
// SYSTEM ADMINISTRATION ENDPOINTS
// ===========================

// Course Definition Management
router.get('/sysadmin/courses', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        course_code,
        duration_hours,
        duration_minutes,
        prerequisites,
        certification_type,
        validity_period_months,
        course_category,
        is_active,
        regulatory_compliance,
        created_at,
        updated_at
      FROM class_types
      ORDER BY name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}));

router.post('/sysadmin/courses', asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      duration_hours,
      duration_minutes,
      prerequisites,
      certification_type,
      validity_period_months,
      course_category,
      regulatory_compliance
    } = req.body;

    if (!name) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Course name is required');
    }

    // Generate course code from first 3 letters of name
    const courseCode = name.substring(0, 3).toUpperCase();

    const result = await pool.query(`
      INSERT INTO class_types (
        name, description, course_code, duration_hours, duration_minutes,
        prerequisites, certification_type, validity_period_months,
        course_category, regulatory_compliance, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      RETURNING *
    `, [
      name, description, courseCode, duration_hours, duration_minutes,
      prerequisites, certification_type, validity_period_months,
      course_category, regulatory_compliance
    ]);

    res.json({
      success: true,
      message: 'Course created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}));

router.put('/sysadmin/courses/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      duration_hours,
      duration_minutes,
      prerequisites,
      certification_type,
      validity_period_months,
      course_category,
      regulatory_compliance,
      is_active
    } = req.body;

    // Generate course code from first 3 letters of name if name is updated
    const courseCode = name ? name.substring(0, 3).toUpperCase() : undefined;

    const result = await pool.query(`
      UPDATE class_types
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        course_code = COALESCE($3, course_code),
        duration_hours = COALESCE($4, duration_hours),
        duration_minutes = COALESCE($5, duration_minutes),
        prerequisites = COALESCE($6, prerequisites),
        certification_type = COALESCE($7, certification_type),
        validity_period_months = COALESCE($8, validity_period_months),
        course_category = COALESCE($9, course_category),
        regulatory_compliance = COALESCE($10, regulatory_compliance),
        is_active = COALESCE($11, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `, [
      name, description, courseCode, duration_hours, duration_minutes,
      prerequisites, certification_type, validity_period_months,
      course_category, regulatory_compliance, is_active, id
    ]);

    if (result.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course not found');
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}));

router.delete('/sysadmin/courses/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE class_types
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course not found');
    }

    res.json({
      success: true,
      message: 'Course deactivated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deactivating course:', error);
    throw error;
  }
}));

// User Management
router.get('/sysadmin/users', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.first_name,
        u.last_name,
        u.role,
        u.mobile,
        u.date_onboarded,
        u.date_offboarded,
        u.user_comments,
        u.status,
        u.organization_id,
        o.name as organization_name,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}));

router.post('/sysadmin/users', asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      full_name,
      role,
      mobile,
      organization_id,
      date_onboarded,
      user_comments
    } = req.body;

    if (!username || !email || !password || !role) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Username, email, password, and role are required');
    }

    // Check if username already exists
    const existingUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUsername.rows.length > 0) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Username already exists. Please choose a different username.');
    }

    // Check if email already exists
    const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Email address already exists. Please use a different email address.');
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync(password, 10);
    const displayName = full_name || `${first_name || ''} ${last_name || ''}`.trim();

    const result = await pool.query(`
      INSERT INTO users (
        username, email, password_hash, full_name, first_name, last_name,
        role, mobile, organization_id, date_onboarded, user_comments, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
      RETURNING id, username, email, full_name, first_name, last_name, role, mobile, organization_id, date_onboarded, user_comments, status
    `, [
      username, email, passwordHash, displayName, first_name, last_name,
      role, mobile, organization_id, date_onboarded, user_comments
    ]);

    res.json({
      success: true,
      message: 'User created successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle specific database constraint violations
    if (error.code === '23505') { // Unique constraint violation
      if (error.constraint === 'users_email_key') {
        throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Email address already exists. Please use a different email address.');
      } else if (error.constraint === 'users_username_key') {
        throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Username already exists. Please choose a different username.');
      }
    }
    
    // Re-throw AppErrors as-is
    if (error instanceof AppError) {
      throw error;
    }
    
    // Generic error for unexpected issues
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to create user');
  }
}));

router.put('/sysadmin/users/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      full_name,
      role,
      mobile,
      organization_id,
      date_onboarded,
      date_offboarded,
      user_comments,
      status
    } = req.body;

    let passwordHash = undefined;
    if (password) {
      const bcrypt = require('bcryptjs');
      passwordHash = bcrypt.hashSync(password, 10);
    }

    const displayName = full_name || (first_name || last_name ? `${first_name || ''} ${last_name || ''}`.trim() : undefined);

    const result = await pool.query(`
      UPDATE users
      SET 
        username = COALESCE($1, username),
        email = COALESCE($2, email),
        password_hash = COALESCE($3, password_hash),
        full_name = COALESCE($4, full_name),
        first_name = COALESCE($5, first_name),
        last_name = COALESCE($6, last_name),
        role = COALESCE($7, role),
        mobile = COALESCE($8, mobile),
        organization_id = COALESCE($9, organization_id),
        date_onboarded = COALESCE($10, date_onboarded),
        date_offboarded = COALESCE($11, date_offboarded),
        user_comments = COALESCE($12, user_comments),
        status = COALESCE($13, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING id, username, email, full_name, first_name, last_name, role, mobile, organization_id, date_onboarded, date_offboarded, user_comments, status
    `, [
      username, email, passwordHash, displayName, first_name, last_name,
      role, mobile, organization_id, date_onboarded, date_offboarded,
      user_comments, status, id
    ]);

    if (result.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'User not found');
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}));

router.delete('/sysadmin/users/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE users
      SET status = 'inactive', date_offboarded = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, email, status
    `, [id]);

    if (result.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'User not found');
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
}));

// Vendor Management
router.get('/sysadmin/vendors', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        vendor_name,
        contact_first_name,
        contact_last_name,
        email,
        mobile,
        phone,
        address_street,
        address_city,
        address_province,
        address_postal_code,
        vendor_type,
        services,
        contract_start_date,
        contract_end_date,
        performance_rating,
        insurance_expiry,
        certification_status,
        billing_contact_email,
        status,
        comments,
        created_at,
        updated_at
      FROM vendors
      ORDER BY vendor_name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
}));

router.post('/sysadmin/vendors', asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      vendor_name,
      contact_first_name,
      contact_last_name,
      email,
      mobile,
      phone,
      address_street,
      address_city,
      address_province,
      address_postal_code,
      vendor_type,
      services,
      contract_start_date,
      contract_end_date,
      performance_rating,
      insurance_expiry,
      certification_status,
      billing_contact_email,
      comments
    } = req.body;

    if (!vendor_name) {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Vendor name is required');
    }

    const result = await pool.query(`
      INSERT INTO vendors (
        vendor_name, contact_first_name, contact_last_name, email, mobile, phone,
        address_street, address_city, address_province, address_postal_code,
        vendor_type, services, contract_start_date, contract_end_date,
        performance_rating, insurance_expiry, certification_status,
        billing_contact_email, comments, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'active')
      RETURNING *
    `, [
      vendor_name, contact_first_name, contact_last_name, email, mobile, phone,
      address_street, address_city, address_province, address_postal_code,
      vendor_type, services, contract_start_date, contract_end_date,
      performance_rating, insurance_expiry, certification_status,
      billing_contact_email, comments
    ]);

    res.json({
      success: true,
      message: 'Vendor created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    throw error;
  }
}));

router.put('/sysadmin/vendors/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      vendor_name,
      contact_first_name,
      contact_last_name,
      email,
      mobile,
      phone,
      address_street,
      address_city,
      address_province,
      address_postal_code,
      vendor_type,
      services,
      contract_start_date,
      contract_end_date,
      performance_rating,
      insurance_expiry,
      certification_status,
      billing_contact_email,
      status,
      comments
    } = req.body;

    const result = await pool.query(`
      UPDATE vendors
      SET 
        vendor_name = COALESCE($1, vendor_name),
        contact_first_name = COALESCE($2, contact_first_name),
        contact_last_name = COALESCE($3, contact_last_name),
        email = COALESCE($4, email),
        mobile = COALESCE($5, mobile),
        phone = COALESCE($6, phone),
        address_street = COALESCE($7, address_street),
        address_city = COALESCE($8, address_city),
        address_province = COALESCE($9, address_province),
        address_postal_code = COALESCE($10, address_postal_code),
        vendor_type = COALESCE($11, vendor_type),
        services = COALESCE($12, services),
        contract_start_date = COALESCE($13, contract_start_date),
        contract_end_date = COALESCE($14, contract_end_date),
        performance_rating = COALESCE($15, performance_rating),
        insurance_expiry = COALESCE($16, insurance_expiry),
        certification_status = COALESCE($17, certification_status),
        billing_contact_email = COALESCE($18, billing_contact_email),
        status = COALESCE($19, status),
        comments = COALESCE($20, comments),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $21
      RETURNING *
    `, [
      vendor_name, contact_first_name, contact_last_name, email, mobile, phone,
      address_street, address_city, address_province, address_postal_code,
      vendor_type, services, contract_start_date, contract_end_date,
      performance_rating, insurance_expiry, certification_status,
      billing_contact_email, status, comments, id
    ]);

    if (result.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Vendor not found');
    }

    res.json({
      success: true,
      message: 'Vendor updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    throw error;
  }
}));

router.delete('/sysadmin/vendors/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE vendors
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Vendor not found');
    }

    res.json({
      success: true,
      message: 'Vendor deactivated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deactivating vendor:', error);
    throw error;
  }
}));

// System Administration Dashboard
router.get('/sysadmin/dashboard', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get total counts
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users WHERE status = \'active\'');
    const organizationCount = await pool.query('SELECT COUNT(*) as count FROM organizations');
    const courseCount = await pool.query('SELECT COUNT(*) as count FROM class_types WHERE is_active = true');
    const vendorCount = await pool.query('SELECT COUNT(*) as count FROM vendors WHERE status = \'active\'');
    
    // Get recent activity
    const recentUsers = await pool.query(`
      SELECT username, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    const recentCourses = await pool.query(`
      SELECT name, course_code, created_at 
      FROM class_types 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    const dashboardData = {
      summary: {
        totalUsers: parseInt(userCount.rows[0].count),
        totalOrganizations: parseInt(organizationCount.rows[0].count),
        totalCourses: parseInt(courseCount.rows[0].count),
        totalVendors: parseInt(vendorCount.rows[0].count)
      },
      recentActivity: {
        users: recentUsers.rows,
        courses: recentCourses.rows
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching system admin dashboard:', error);
    throw error;
  }
}));

// Organization Management
router.get('/sysadmin/organizations', asyncHandler(async (req: Request, res: Response) => {
  console.log('[Debug] Getting all organizations for sysadmin');
  
  const query = `
    SELECT 
      o.id,
      o.name as organization_name,
      o.address,
      o.city,
      o.province,
      o.postal_code,
      o.country,
      o.created_at,
      o.contact_person,
      o.contact_position,
      o.contact_email,
      o.contact_phone,
      o.organization_comments,
      COUNT(DISTINCT u.id) as user_count,
      COUNT(DISTINCT cr.id) as course_count
    FROM organizations o
    LEFT JOIN users u ON u.organization_id = o.id
    LEFT JOIN course_requests cr ON cr.organization_id = o.id
    GROUP BY o.id, o.name, o.address, o.city, o.province, 
             o.postal_code, o.country, o.contact_person, o.contact_position,
             o.contact_email, o.contact_phone, o.organization_comments
    ORDER BY o.name
  `;
  
  const result = await pool.query(query);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

router.post('/sysadmin/organizations', asyncHandler(async (req: Request, res: Response) => {
  console.log('[Debug] Creating new organization:', req.body);
  
  const {
    name,
    address,
    city,
    province,
    postal_code,
    country,
    contact_person,
    contact_position,
    contact_email,
    contact_phone,
    organization_comments
  } = req.body;
  
  const query = `
    INSERT INTO organizations (
      name,
      address,
      city,
      province,
      postal_code,
      country,
      contact_person,
      contact_position,
      contact_email,
      contact_phone,
      organization_comments,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  
  const values = [
    name,
    address || '',
    city || '',
    province || '',
    postal_code || '',
    country || 'Canada',
    contact_person,
    contact_position,
    contact_email,
    contact_phone,
    organization_comments
  ];
  
  const result = await pool.query(query, values);
  
  res.status(201).json({
    success: true,
    data: result.rows[0],
    message: 'Organization created successfully'
  });
}));

router.put('/sysadmin/organizations/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('[Debug] Updating organization:', id, req.body);
  
  const {
    name,
    address,
    city,
    province,
    postal_code,
    country,
    contact_person,
    contact_position,
    contact_email,
    contact_phone,
    organization_comments
  } = req.body;
  
  const query = `
    UPDATE organizations
    SET 
      name = $1,
      address = $2,
      city = $3,
      province = $4,
      postal_code = $5,
      country = $6,
      contact_person = $7,
      contact_position = $8,
      contact_email = $9,
      contact_phone = $10,
      organization_comments = $11
    WHERE id = $12
    RETURNING *
  `;
  
  const values = [
    name,
    address || '',
    city || '',
    province || '',
    postal_code || '',
    country || 'Canada',
    contact_person,
    contact_position,
    contact_email,
    contact_phone,
    organization_comments,
    id
  ];
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: { message: 'Organization not found' }
    });
  }
  
  res.json({
    success: true,
    data: result.rows[0],
    message: 'Organization updated successfully'
  });
}));

router.delete('/sysadmin/organizations/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('[Debug] Deleting organization:', id);
  
  // Check for dependencies
  const checkQuery = `
    SELECT 
      COUNT(DISTINCT u.id) as user_count,
      COUNT(DISTINCT cr.id) as course_count
    FROM organizations o
    LEFT JOIN users u ON u.organization_id = o.id
    LEFT JOIN course_requests cr ON cr.organization_id = o.id
    WHERE o.id = $1
  `;
  
  const checkResult = await pool.query(checkQuery, [id]);
  const { user_count, course_count } = checkResult.rows[0];
  
  if (parseInt(user_count) > 0 || parseInt(course_count) > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Cannot delete organization with associated users or courses',
        details: `${user_count} users and ${course_count} courses are linked to this organization`
      }
    });
  }
  
  const deleteQuery = 'DELETE FROM organizations WHERE id = $1 RETURNING *';
  const result = await pool.query(deleteQuery, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: { message: 'Organization not found' }
    });
  }
  
  res.json({
    success: true,
    message: 'Organization deleted successfully'
  });
}));

// Admin endpoint to get students for a specific course
router.get('/admin/courses/:courseId/students', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userRole = req.user?.role;

    // Only admin users can access this endpoint
    if (userRole !== 'admin') {
      throw new AppError(403, errorCodes.AUTH_INSUFFICIENT_PERMISSIONS, 'Access denied. Admin role required.');
    }

    // Verify the course exists
    const courseCheck = await pool.query(
      'SELECT id FROM course_requests WHERE id = $1',
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course not found');
    }

    // Get students for this course with attendance information
    const result = await pool.query(
      `SELECT 
        s.id,
        s.course_request_id,
        s.first_name,
        s.last_name,
        s.email,
        s.attended,
        s.attendance_marked,
        s.created_at
       FROM course_students s
       WHERE s.course_request_id = $1
       ORDER BY s.last_name, s.first_name`,
      [courseId]
    );

    return res.json(ApiResponseBuilder.success(result.rows));
  } catch (error: any) {
    console.error('Error fetching course students:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch course students');
  }
}));

// Mark course as ready for billing
router.put('/courses/:courseId/ready-for-billing', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    // First check if the course exists and is completed
    const courseCheck = await pool.query(`
      SELECT id, status FROM course_requests WHERE id = $1
    `, [courseId]);

    if (courseCheck.rows.length === 0) {
      throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course not found');
    }

    if (courseCheck.rows[0].status !== 'completed') {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Only completed courses can be marked as ready for billing');
    }

    // Update the course to mark it as ready for billing
    const result = await pool.query(`
      UPDATE course_requests 
      SET ready_for_billing = true,
          ready_for_billing_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [courseId]);

    res.json({
      success: true,
      message: 'Course marked as ready for billing',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking course as ready for billing:', error);
    throw error;
  }
}));

export default router; 