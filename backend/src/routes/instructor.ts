import express from 'express';
import { format } from 'date-fns';
import { pool } from '../config/database';
import { ApiResponseBuilder } from '../utils/apiResponse';
import { AppError, errorCodes } from '../utils/errorHandler';

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
        
        // Query to get all classes for the instructor (both regular classes and those created from course assignments)
        const result = await pool.query(
            `SELECT 
                c.id as course_id,
                c.date::text as datescheduled,
                c.start_time::text, 
                c.end_time::text, 
                c.status, 
                c.location,
                c.max_students,
                c.current_students,
                ct.name as coursetypename,
                COALESCE(o.name, 'Unassigned') as organizationname,
                COALESCE(cr.notes, '') as notes,
                COALESCE(cr.registered_students, c.max_students, 0) as studentcount
             FROM classes c 
             LEFT JOIN class_types ct ON c.type_id = ct.id 
             LEFT JOIN course_requests cr ON cr.instructor_id = c.instructor_id 
                AND cr.status = 'confirmed'
                AND DATE(cr.confirmed_date) = DATE(c.date)
                AND cr.course_type_id = c.type_id
             LEFT JOIN organizations o ON cr.organization_id = o.id
             WHERE c.instructor_id = $1 AND c.date >= CURRENT_DATE AND c.status != 'completed'
             ORDER BY c.date, c.start_time`,
            [instructorId]
        );
        
        const formattedClasses = result.rows.map(row => ({
            course_id: row.course_id.toString(),
            datescheduled: row.datescheduled,
            coursetypename: row.coursetypename || 'CPR Class',
            organizationname: row.organizationname || 'Unassigned',
            location: row.location || 'TBD',
            studentcount: row.studentcount || 0,
            studentsregistered: row.studentcount || 0,
            studentsattendance: row.current_students || 0,
            notes: row.notes || '',
            status: row.status || 'scheduled',
            max_students: row.max_students || 10,
            current_students: row.current_students || 0,
            start_time: row.start_time ? row.start_time.slice(0, 5) : '09:00',
            end_time: row.end_time ? row.end_time.slice(0, 5) : '12:00'
        }));
        
        res.json(ApiResponseBuilder.success(formattedClasses));
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
             WHERE c.instructor_id = $1 AND c.date >= CURRENT_DATE AND c.status != 'completed'
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
            `SELECT id, instructor_id, date::text, status, created_at, updated_at 
             FROM instructor_availability 
             WHERE instructor_id = $1 
             AND date >= CURRENT_DATE 
             AND (status = 'available' OR status IS NULL)
             ORDER BY date`,
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
             WHERE c.instructor_id = $1 AND c.date >= CURRENT_DATE AND c.status != 'completed'
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

// Attendance Management Endpoints

// Get today's classes for attendance
router.get('/classes/today', async (req, res) => {
    try {
        const instructorId = parseInt(req.user?.userId || '0', 10);
        if (!instructorId) {
            return res.status(400).json(ApiResponseBuilder.error(errorCodes.VALIDATION_ERROR, 'Invalid instructor ID'));
        }
        
        console.log('[Debug] Fetching today\'s classes for instructor ID:', instructorId);
        
        const result = await pool.query(
            `SELECT 
                c.id as course_id,
                c.date::text as datescheduled,
                c.start_time::text, 
                c.end_time::text, 
                c.status, 
                c.location,
                c.max_students,
                c.current_students,
                ct.name as coursetypename,
                COALESCE(o.name, 'Unassigned') as organizationname,
                COALESCE(cr.notes, '') as notes,
                COALESCE(cr.registered_students, c.max_students, 0) as studentcount
             FROM classes c 
             LEFT JOIN class_types ct ON c.type_id = ct.id 
             LEFT JOIN course_requests cr ON cr.instructor_id = c.instructor_id 
                AND cr.status = 'confirmed'
                AND DATE(cr.confirmed_date) = DATE(c.date)
                AND cr.course_type_id = c.type_id
             LEFT JOIN organizations o ON cr.organization_id = o.id
             WHERE c.instructor_id = $1 AND DATE(c.date) = CURRENT_DATE AND c.status != 'completed'
             ORDER BY c.start_time`,
            [instructorId]
        );
        
        const formattedClasses = result.rows.map(row => ({
            course_id: row.course_id.toString(),
            datescheduled: row.datescheduled,
            coursetypename: row.coursetypename || 'CPR Class',
            organizationname: row.organizationname || 'Unassigned',
            location: row.location || 'TBD',
            studentcount: row.studentcount || 0,
            studentsregistered: row.studentcount || 0,
            studentsattendance: row.current_students || 0,
            notes: row.notes || '',
            status: row.status || 'scheduled',
            max_students: row.max_students || 10,
            current_students: row.current_students || 0,
            start_time: row.start_time ? row.start_time.slice(0, 5) : '09:00',
            end_time: row.end_time ? row.end_time.slice(0, 5) : '12:00'
        }));
        
        res.json(ApiResponseBuilder.success(formattedClasses));
    } catch (error) {
        console.error('Error fetching today\'s classes:', error);
        res.status(500).json(ApiResponseBuilder.error(errorCodes.SERVICE_UNAVAILABLE, 'Failed to fetch today\'s classes'));
    }
});

// Get students for a specific class
router.get('/classes/:classId/students', async (req, res) => {
    try {
        const instructorId = parseInt(req.user?.userId || '0', 10);
        const { classId } = req.params;
        
        if (!instructorId) {
            return res.status(400).json(ApiResponseBuilder.error(errorCodes.VALIDATION_ERROR, 'Invalid instructor ID'));
        }
        
        console.log('[Debug] Fetching students for class ID:', classId, 'instructor ID:', instructorId);
        
        // First verify the class belongs to this instructor
        const classCheck = await pool.query(
            'SELECT id FROM classes WHERE id = $1 AND instructor_id = $2',
            [classId, instructorId]
        );
        
        if (classCheck.rows.length === 0) {
            return res.status(404).json(ApiResponseBuilder.error(errorCodes.RESOURCE_NOT_FOUND, 'Class not found or not authorized'));
        }
        
        // Get course_request_id to find students
        const courseRequestResult = await pool.query(
            `SELECT cr.id as course_request_id
             FROM course_requests cr
             JOIN classes c ON cr.instructor_id = c.instructor_id 
                AND DATE(cr.confirmed_date) = DATE(c.date)
                AND cr.course_type_id = c.type_id
             WHERE c.id = $1 AND c.instructor_id = $2`,
            [classId, instructorId]
        );
        
        let students: any[] = [];
        
        if (courseRequestResult.rows.length > 0) {
            const courseRequestId = courseRequestResult.rows[0].course_request_id;
            
            // Get students from course_students table
            const studentsResult = await pool.query(
                `SELECT 
                    cs.id,
                    cs.first_name,
                    cs.last_name,
                    cs.email,
                    cs.attendance_marked,
                    cs.attended,
                    cs.created_at
                 FROM course_students cs
                 WHERE cs.course_request_id = $1
                 ORDER BY cs.last_name, cs.first_name`,
                [courseRequestId]
            );
            
            students = studentsResult.rows.map(row => ({
                studentid: row.id.toString(),
                firstname: row.first_name,
                lastname: row.last_name,
                email: row.email || '',
                attendance: row.attended || false,
                attendanceMarked: row.attendance_marked || false
            }));
        }
        
        res.json(ApiResponseBuilder.success(students));
    } catch (error) {
        console.error('Error fetching class students:', error);
        res.status(500).json(ApiResponseBuilder.error(errorCodes.SERVICE_UNAVAILABLE, 'Failed to fetch class students'));
    }
});

// Add student to a specific class
router.post('/classes/:classId/students', async (req, res) => {
    try {
        const instructorId = parseInt(req.user?.userId || '0', 10);
        const { classId } = req.params;
        const { firstName, lastName, email } = req.body;
        
        if (!instructorId) {
            return res.status(400).json(ApiResponseBuilder.error(errorCodes.VALIDATION_ERROR, 'Invalid instructor ID'));
        }
        
        if (!firstName || !lastName) {
            return res.status(400).json(ApiResponseBuilder.error(errorCodes.VALIDATION_ERROR, 'First name and last name are required'));
        }
        
        console.log('[Debug] Adding student to class ID:', classId, 'instructor ID:', instructorId);
        
        // First verify the class belongs to this instructor
        const classCheck = await pool.query(
            'SELECT id FROM classes WHERE id = $1 AND instructor_id = $2',
            [classId, instructorId]
        );
        
        if (classCheck.rows.length === 0) {
            return res.status(404).json(ApiResponseBuilder.error(errorCodes.RESOURCE_NOT_FOUND, 'Class not found or not authorized'));
        }
        
        // Get course_request_id to add student
        const courseRequestResult = await pool.query(
            `SELECT cr.id as course_request_id
             FROM course_requests cr
             JOIN classes c ON cr.instructor_id = c.instructor_id 
                AND DATE(cr.confirmed_date) = DATE(c.date)
                AND cr.course_type_id = c.type_id
             WHERE c.id = $1 AND c.instructor_id = $2`,
            [classId, instructorId]
        );
        
        if (courseRequestResult.rows.length === 0) {
            return res.status(404).json(ApiResponseBuilder.error(errorCodes.RESOURCE_NOT_FOUND, 'Associated course request not found'));
        }
        
        const courseRequestId = courseRequestResult.rows[0].course_request_id;
        
        // Add student to course_students table
        const result = await pool.query(
            `INSERT INTO course_students (course_request_id, first_name, last_name, email)
             VALUES ($1, $2, $3, $4)
             RETURNING id, first_name, last_name, email, attendance_marked, attended`,
            [courseRequestId, firstName.trim(), lastName.trim(), email?.trim() || null]
        );
        
        const newStudent = {
            studentid: result.rows[0].id.toString(),
            firstname: result.rows[0].first_name,
            lastname: result.rows[0].last_name,
            email: result.rows[0].email || '',
            attendance: result.rows[0].attended || false,
            attendanceMarked: result.rows[0].attendance_marked || false
        };
        
        res.json(ApiResponseBuilder.success(newStudent, { message: 'Student added successfully' }));
    } catch (error) {
        console.error('Error adding student to class:', error);
        res.status(500).json(ApiResponseBuilder.error(errorCodes.SERVICE_UNAVAILABLE, 'Failed to add student to class'));
    }
});

// Update student attendance
router.put('/classes/:classId/students/:studentId/attendance', async (req, res) => {
    try {
        const instructorId = parseInt(req.user?.userId || '0', 10);
        const { classId, studentId } = req.params;
        const { attended } = req.body;
        
        if (!instructorId) {
            return res.status(400).json(ApiResponseBuilder.error(errorCodes.VALIDATION_ERROR, 'Invalid instructor ID'));
        }
        
        if (typeof attended !== 'boolean') {
            return res.status(400).json(ApiResponseBuilder.error(errorCodes.VALIDATION_ERROR, 'Attended status must be a boolean'));
        }
        
        console.log('[Debug] Updating attendance for student ID:', studentId, 'class ID:', classId, 'attended:', attended);
        
        // First verify the class belongs to this instructor
        const classCheck = await pool.query(
            'SELECT id FROM classes WHERE id = $1 AND instructor_id = $2',
            [classId, instructorId]
        );
        
        if (classCheck.rows.length === 0) {
            return res.status(404).json(ApiResponseBuilder.error(errorCodes.RESOURCE_NOT_FOUND, 'Class not found or not authorized'));
        }
        
        // Get course_request_id to update attendance count
        const courseRequestResult = await pool.query(
            `SELECT cr.id as course_request_id
             FROM course_requests cr
             JOIN classes c ON cr.instructor_id = c.instructor_id 
                AND DATE(cr.confirmed_date) = DATE(c.date)
                AND cr.course_type_id = c.type_id
             WHERE c.id = $1 AND c.instructor_id = $2`,
            [classId, instructorId]
        );
        
        // Update student attendance
        const result = await pool.query(
            `UPDATE course_students 
             SET attended = $1, attendance_marked = true, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, first_name, last_name, email, attendance_marked, attended`,
            [attended, studentId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json(ApiResponseBuilder.error(errorCodes.RESOURCE_NOT_FOUND, 'Student not found'));
        }
        
        // Update the current_students count in classes table
        if (courseRequestResult.rows.length > 0) {
            const courseRequestId = courseRequestResult.rows[0].course_request_id;
            
            // Count the number of students who attended
            const attendanceCountResult = await pool.query(
                `SELECT COUNT(*) as attended_count
                 FROM course_students
                 WHERE course_request_id = $1 AND attended = true`,
                [courseRequestId]
            );
            
            const attendedCount = parseInt(attendanceCountResult.rows[0].attended_count || '0');
            
            // Update the classes table with the new attendance count
            await pool.query(
                `UPDATE classes 
                 SET current_students = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [attendedCount, classId]
            );
            
            console.log('[Debug] Updated class ID:', classId, 'with attended count:', attendedCount);
        }
        
        const updatedStudent = {
            studentid: result.rows[0].id.toString(),
            firstname: result.rows[0].first_name,
            lastname: result.rows[0].last_name,
            email: result.rows[0].email || '',
            attendance: result.rows[0].attended || false,
            attendanceMarked: result.rows[0].attendance_marked || false
        };
        
        res.json(ApiResponseBuilder.success(updatedStudent, { message: 'Attendance updated successfully' }));
    } catch (error) {
        console.error('Error updating student attendance:', error);
        res.status(500).json(ApiResponseBuilder.error(errorCodes.SERVICE_UNAVAILABLE, 'Failed to update student attendance'));
    }
});

/**
 * @route PUT /classes/:classId/complete
 * @description Mark a class as completed by the instructor
 * @access Private (Instructor only)
 * @param {string} classId - The ID of the class to mark as complete
 * @body {boolean} [generateCertificates=false] - Whether to generate certificates for students
 * @returns {Object} Success response with completion details
 * 
 * @security
 * - Validates instructor owns the class
 * - Ensures class is in past or current date
 * - Validates all students have attendance marked
 * - Uses database transaction for data integrity
 * - Logs completion action for audit trail
 */
router.put('/classes/:classId/complete', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const instructorId = parseInt(req.user?.userId || '0', 10);
        const { classId } = req.params;
        const { generateCertificates = false } = req.body;
        
        // Input validation with detailed error messages
        if (!instructorId) {
            throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Invalid instructor credentials');
        }
        
        if (!classId || isNaN(parseInt(classId))) {
            throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Invalid class ID provided');
        }
        
        console.log(`[Audit] Instructor ${instructorId} attempting to complete class ${classId}`);
        
        // Verify class ownership and get class details
        const classResult = await client.query(
            `SELECT c.id, c.date, c.status, c.instructor_id, c.location, c.start_time, c.end_time,
                    ct.name as course_type, c.current_students, c.max_students
             FROM classes c
             LEFT JOIN class_types ct ON c.type_id = ct.id
             WHERE c.id = $1 AND c.instructor_id = $2`,
            [classId, instructorId]
        );
        
        if (classResult.rows.length === 0) {
            throw new AppError(404, errorCodes.RESOURCE_NOT_FOUND, 'Class not found or access denied');
        }
        
        const classData = classResult.rows[0];
        
        // Business logic validation
        if (classData.status === 'completed') {
            throw new AppError(409, errorCodes.VALIDATION_ERROR, 'Class is already marked as completed');
        }
        
        if (classData.status === 'cancelled') {
            throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Cannot complete a cancelled class');
        }
        
        // Ensure class date is not in the future (with 1-hour grace period for same-day completion)
        const classDate = new Date(classData.date);
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));
        
        if (classDate > oneHourFromNow) {
            throw new AppError(400, errorCodes.VALIDATION_ERROR, 
                'Cannot complete a class scheduled for the future. Please wait until the class date.');
        }
        
        // Get course request details for organization info
        const courseRequestResult = await client.query(
            `SELECT cr.id as course_request_id, cr.organization_id, o.name as organization_name
             FROM course_requests cr
             JOIN organizations o ON cr.organization_id = o.id
             JOIN classes c ON cr.instructor_id = c.instructor_id 
                AND DATE(cr.confirmed_date) = DATE(c.date)
                AND cr.course_type_id = c.type_id
             WHERE c.id = $1 AND c.instructor_id = $2`,
            [classId, instructorId]
        );
        
        // Validate student attendance is marked (business requirement)
        if (courseRequestResult.rows.length > 0) {
            const courseRequestId = courseRequestResult.rows[0].course_request_id;
            
            const unmarkedStudentsResult = await client.query(
                `SELECT COUNT(*) as unmarked_count
                 FROM course_students
                 WHERE course_request_id = $1 AND attendance_marked = false`,
                [courseRequestId]
            );
            
            const unmarkedCount = parseInt(unmarkedStudentsResult.rows[0].unmarked_count);
            
            if (unmarkedCount > 0) {
                throw new AppError(400, errorCodes.VALIDATION_ERROR, 
                    `Cannot complete class: ${unmarkedCount} student(s) have unmarked attendance. Please mark all students' attendance before completing the class.`);
            }
        }
        
        // Update class status to completed with completion timestamp
        const completionTime = new Date();
        await client.query(
            `UPDATE classes 
             SET status = 'completed', 
                 updated_at = $1,
                 completed_at = $1
             WHERE id = $2`,
            [completionTime, classId]
        );
        
        // Update course request status if exists
        if (courseRequestResult.rows.length > 0) {
            await client.query(
                `UPDATE course_requests 
                 SET status = 'completed', 
                     updated_at = $1,
                     completed_at = $1
                 WHERE id = $2`,
                [completionTime, courseRequestResult.rows[0].course_request_id]
            );
        }
        
        // Update instructor availability status to 'completed' instead of deleting
        // This maintains the audit trail and prevents double-booking
        const availabilityUpdateResult = await client.query(
            `UPDATE instructor_availability 
             SET status = 'completed', 
                 updated_at = $1
             WHERE instructor_id = $2 AND date = $3
             RETURNING id, status`,
            [completionTime, instructorId, classData.date]
        );
        
        if (availabilityUpdateResult.rows.length === 0) {
            console.log(`[Warning] No availability record found to update for instructor ${instructorId} on date ${classData.date}`);
        } else {
            console.log(`[Audit] Updated availability record ${availabilityUpdateResult.rows[0].id} to status '${availabilityUpdateResult.rows[0].status}' for instructor ${instructorId} on date ${classData.date}`);
        }
        
        // Create audit log entry for compliance and tracking
        await client.query(
            `INSERT INTO activity_logs (
                user_id, action, resource_type, resource_id, 
                details, ip_address, user_agent, created_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                instructorId,
                'COURSE_COMPLETED',
                'class',
                classId,
                JSON.stringify({
                    class_date: classData.date,
                    course_type: classData.course_type,
                    location: classData.location,
                    students_count: classData.current_students,
                    organization: courseRequestResult.rows[0]?.organization_name || 'Unassigned',
                    completion_time: completionTime.toISOString()
                }),
                req.ip || req.connection.remoteAddress,
                req.get('User-Agent') || 'Unknown',
                completionTime
            ]
        );
        
        // Get final class data for response
        const completedClassResult = await client.query(
            `SELECT c.id, c.date::text as date_completed, c.status, 
                    ct.name as course_type, c.current_students,
                    COALESCE(o.name, 'Unassigned') as organization_name
             FROM classes c
             LEFT JOIN class_types ct ON c.type_id = ct.id
             LEFT JOIN course_requests cr ON cr.instructor_id = c.instructor_id 
                AND DATE(cr.confirmed_date) = DATE(c.date)
                AND cr.course_type_id = c.type_id
             LEFT JOIN organizations o ON cr.organization_id = o.id
             WHERE c.id = $1`,
            [classId]
        );
        
        await client.query('COMMIT');
        
        console.log(`[Audit] Class ${classId} successfully completed by instructor ${instructorId}`);
        
        res.json(ApiResponseBuilder.success(
            {
                class_id: classId,
                status: 'completed',
                completion_time: completionTime.toISOString(),
                students_attended: classData.current_students,
                course_details: completedClassResult.rows[0]
            },
            { 
                message: 'Class marked as completed successfully',
                next_action: 'Class has been moved to your archive'
            }
        ));
        
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`[Error] Failed to complete class ${req.params.classId}:`, error);
        
        if (error instanceof AppError) {
            return res.status(error.statusCode).json(
                ApiResponseBuilder.error(error.code, error.message)
            );
        }
        
        res.status(500).json(
            ApiResponseBuilder.error(
                errorCodes.SERVICE_UNAVAILABLE, 
                'Failed to complete class. Please try again or contact support.'
            )
        );
    } finally {
        client.release();
    }
});

/**
 * @route GET /classes/completed
 * @description Get instructor's completed classes for archive view
 * @access Private (Instructor only)
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Number of records per page
 * @query {string} [sortBy=date] - Sort field (date, course_type, organization)
 * @query {string} [sortOrder=desc] - Sort order (asc, desc)
 * @returns {Object} Paginated list of completed classes
 */
router.get('/classes/completed', async (req, res) => {
    try {
        const instructorId = parseInt(req.user?.userId || '0', 10);
        if (!instructorId) {
            throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Invalid instructor credentials');
        }
        
        // Pagination and sorting with validation
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
        const offset = (page - 1) * limit;
        
        const validSortFields = ['date', 'course_type', 'organization', 'students_count'];
        const sortBy = validSortFields.includes(req.query.sortBy as string) 
            ? req.query.sortBy as string 
            : 'date';
        const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
        
        console.log(`[Debug] Fetching completed classes for instructor ${instructorId}, page ${page}`);
        
        // Get total count for pagination
        const countResult = await pool.query(
            `SELECT COUNT(*) as total
             FROM classes c
             WHERE c.instructor_id = $1 AND c.status = 'completed'`,
            [instructorId]
        );
        
        const totalRecords = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalRecords / limit);
        
        // Get completed classes with rich details
        const sortField = sortBy === 'date' ? 'c.date' :
                         sortBy === 'course_type' ? 'ct.name' :
                         sortBy === 'organization' ? 'o.name' :
                         'c.current_students';
        
        const result = await pool.query(
            `SELECT 
                c.id as course_id,
                c.date::text as datescheduled,
                c.completed_at::text as date_completed,
                c.start_time::text,
                c.end_time::text,
                c.location,
                c.current_students as students_attended,
                c.max_students,
                ct.name as coursetypename,
                COALESCE(o.name, 'Unassigned') as organizationname,
                COALESCE(cr.notes, '') as notes,
                COALESCE(cr.registered_students, c.max_students, 0) as studentsregistered,
                c.status
             FROM classes c 
             LEFT JOIN class_types ct ON c.type_id = ct.id 
             LEFT JOIN course_requests cr ON cr.instructor_id = c.instructor_id 
                AND cr.status = 'completed'
                AND DATE(cr.confirmed_date) = DATE(c.date)
                AND cr.course_type_id = c.type_id
             LEFT JOIN organizations o ON cr.organization_id = o.id
             WHERE c.instructor_id = $1 AND c.status = 'completed'
             ORDER BY ${sortField} ${sortOrder}, c.date DESC
             LIMIT $2 OFFSET $3`,
            [instructorId, limit, offset]
        );
        
        const formattedClasses = result.rows.map(row => ({
            course_id: row.course_id.toString(),
            datescheduled: row.datescheduled,
            date_completed: row.date_completed,
            coursetypename: row.coursetypename || 'CPR Class',
            organizationname: row.organizationname,
            location: row.location || 'TBD',
            studentsregistered: row.studentsregistered || 0,
            studentsattended: row.students_attended || 0,
            studentsattendance: row.students_attended || 0, // For compatibility
            notes: row.notes || '',
            status: 'Completed',
            max_students: row.max_students || 10,
            start_time: row.start_time ? row.start_time.slice(0, 5) : '09:00',
            end_time: row.end_time ? row.end_time.slice(0, 5) : '12:00',
            completion_date: row.date_completed
        }));
        
        res.json(ApiResponseBuilder.success(
            {
                classes: formattedClasses,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_records: totalRecords,
                    page_size: limit,
                    has_next: page < totalPages,
                    has_previous: page > 1
                },
                sorting: {
                    sort_by: sortBy,
                    sort_order: sortOrder.toLowerCase()
                }
            }
        ));
        
    } catch (error: any) {
        console.error('Error fetching completed classes:', error);
        
        if (error instanceof AppError) {
            return res.status(error.statusCode).json(
                ApiResponseBuilder.error(error.code, error.message)
            );
        }
        
        res.status(500).json(
            ApiResponseBuilder.error(
                errorCodes.SERVICE_UNAVAILABLE, 
                'Failed to fetch completed classes'
            )
        );
    }
});

export default router; 