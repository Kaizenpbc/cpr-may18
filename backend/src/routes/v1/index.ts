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
        cr.location,
        cr.registered_students,
        cr.notes,
        cr.status,
        cr.scheduled_date,
        cr.scheduled_start_time,
        cr.scheduled_end_time,
        cr.created_at,
        ct.name as course_type,
        o.name as organization_name,
        u.username as instructor_name
       FROM course_requests cr
       JOIN class_types ct ON cr.course_type_id = ct.id
       JOIN organizations o ON cr.organization_id = o.id
       LEFT JOIN users u ON cr.instructor_id = u.id
       WHERE cr.status = 'confirmed'
       ORDER BY cr.scheduled_date ASC, cr.scheduled_start_time ASC`
    );

    return res.json(ApiResponseBuilder.success(result.rows));
  } catch (error: any) {
    console.error('Error fetching confirmed courses:', error);
    throw new AppError(500, errorCodes.DB_QUERY_ERROR, 'Failed to fetch confirmed courses');
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

    // Start a transaction to ensure both operations succeed or fail together
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update course request with instructor and mark as confirmed
      const courseUpdateResult = await client.query(
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

      if (courseUpdateResult.rows.length === 0) {
        throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Course request not found');
      }

      const courseRequest = courseUpdateResult.rows[0];

      // Create corresponding entry in classes table so instructor can see it in "My Classes"
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
          scheduledDate,
          startTime,
          endTime,
          courseRequest.location,
          courseRequest.registered_students // Use requested students as max capacity
        ]
      );

      // Remove instructor's availability for the scheduled date to prevent double-booking
      await client.query(
        `DELETE FROM instructor_availability 
         WHERE instructor_id = $1 AND date = $2`,
        [instructorId, scheduledDate]
      );

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
        COALESCE(cr.notes, '') as notes,
        CASE 
          WHEN cr.id IS NOT NULL AND cr.scheduled_date::date = ia.date::date THEN 'Confirmed'
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
         AND cr.status = 'confirmed'
         AND cr.scheduled_date::date = ia.date::date
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

    // Get students for this course
    const result = await pool.query(
      `SELECT 
        s.id,
        s.course_request_id,
        s.first_name,
        s.last_name,
        s.email,
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

export default router; 