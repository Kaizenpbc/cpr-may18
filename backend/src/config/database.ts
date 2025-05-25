import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { retry } from '@lifeomic/attempt';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

// Database configuration
const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'gtacpr',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cpr_may18'
};

// Create the connection pool
const pool = new Pool(poolConfig);

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create default admin user if it doesn't exist
    const adminPassword = 'test123';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@cpr.com', $1, 'admin')
      ON CONFLICT (username) DO NOTHING;
    `, [adminPasswordHash]);

    // Create default instructor user if it doesn't exist
    const instructorPassword = 'test123';
    const instructorPasswordHash = await bcrypt.hash(instructorPassword, 10);
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('instructor', 'instructor@cpr.com', $1, 'instructor')
      ON CONFLICT (username) DO NOTHING;
    `, [instructorPasswordHash]);

    // Create certifications table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        issue_date DATE NOT NULL,
        expiration_date DATE NOT NULL,
        certification_number VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        instructor_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create classes table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        instructor_id INTEGER NOT NULL REFERENCES users(id),
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        location VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        max_students INTEGER NOT NULL DEFAULT 10,
        current_students INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add location column to classes table if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'classes' AND column_name = 'location'
        ) THEN 
          ALTER TABLE classes ADD COLUMN location VARCHAR(255);
        END IF;
      END $$;
    `);

    // Add completed_at column to classes table if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'classes' AND column_name = 'completed_at'
        ) THEN 
          ALTER TABLE classes ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        END IF;
      END $$;
    `);

    // Drop and recreate enrollments table
    await pool.query(`
      DROP TABLE IF EXISTS enrollments CASCADE;
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        class_id INTEGER NOT NULL REFERENCES classes(id),
        student_id INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'enrolled',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(class_id, student_id)
      );
    `);

    // Create instructor_availability table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS instructor_availability (
        id SERIAL PRIMARY KEY,
        instructor_id INTEGER NOT NULL REFERENCES users(id),
        date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'available',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(instructor_id, date)
      );
    `);

    // Create class_types table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS class_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        duration_minutes INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add type_id column to classes table if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'classes' AND column_name = 'type_id'
        ) THEN 
          ALTER TABLE classes ADD COLUMN type_id INTEGER REFERENCES class_types(id);
        END IF;
      END $$;
    `);

    // Insert default class types if none exist
    await pool.query(`
      INSERT INTO class_types (name, description, duration_minutes)
      VALUES 
        ('Basic CPR', 'Basic CPR certification course', 120),
        ('Advanced CPR', 'Advanced CPR certification course', 180),
        ('First Aid', 'Basic first aid certification', 120),
        ('BLS', 'Basic Life Support certification', 240)
      ON CONFLICT (name) DO NOTHING;
    `);

    // Insert a test instructor if none exists
    const instructorResult = await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('instructor', 'instructor@example.com', $1, 'instructor')
      ON CONFLICT (username) DO NOTHING
      RETURNING id;
    `, [await bcrypt.hash('test123', 10)]);

    // Get instructor ID
    const instructorId = instructorResult.rows[0]?.id || 
      (await pool.query('SELECT id FROM users WHERE username = $1', ['instructor'])).rows[0].id;

    // Insert test classes if none exist
    await pool.query(`
      INSERT INTO classes (instructor_id, date, start_time, end_time, location, type_id)
      SELECT 
        $1 as instructor_id,
        CURRENT_DATE + (n || ' days')::INTERVAL as date,
        '09:00:00'::TIME as start_time,
        '12:00:00'::TIME as end_time,
        'Room ' || (n + 101)::TEXT as location,
        ct.id as type_id
      FROM generate_series(0, 5) n
      CROSS JOIN (
        SELECT id FROM class_types 
        ORDER BY RANDOM() 
        LIMIT 1
      ) ct
      WHERE NOT EXISTS (
        SELECT 1 FROM classes 
        WHERE date = CURRENT_DATE + (n || ' days')::INTERVAL
      );
    `, [instructorId]);

    // Insert test instructor availability for the next 7 days
    await pool.query(`
      INSERT INTO instructor_availability (instructor_id, date)
      SELECT 
        $1 as instructor_id,
        CURRENT_DATE + (n || ' days')::INTERVAL as date
      FROM generate_series(0, 7) n
      WHERE NOT EXISTS (
        SELECT 1 FROM instructor_availability 
        WHERE instructor_id = $1 AND date = CURRENT_DATE + (n || ' days')::INTERVAL
      );
    `, [instructorId]);

    // Create organizations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default organizations if none exist
    await pool.query(`
      INSERT INTO organizations (name, contact_email, contact_phone, address)
      VALUES 
        ('Test Organization', 'test@org.com', '555-1234', '123 Main St'),
        ('Demo Company', 'demo@company.com', '555-5678', '456 Business Ave')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Create course_requests table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_requests (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        course_type_id INTEGER NOT NULL REFERENCES class_types(id),
        date_requested DATE NOT NULL,
        location VARCHAR(255) NOT NULL,
        registered_students INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        instructor_id INTEGER REFERENCES users(id),
        scheduled_date DATE,
        scheduled_start_time TIME,
        scheduled_end_time TIME,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add preferred_date column to course_requests table if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'course_requests' AND column_name = 'preferred_date'
        ) THEN 
          ALTER TABLE course_requests ADD COLUMN preferred_date DATE;
        END IF;
      END $$;
    `);

    // Migrate existing data: move date_requested to preferred_date and set date_requested to created_at
    await pool.query(`
      UPDATE course_requests 
      SET preferred_date = date_requested, 
          date_requested = created_at::DATE 
      WHERE preferred_date IS NULL;
    `);

    // Add organization_id to users table if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'organization_id'
        ) THEN 
          ALTER TABLE users ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
        END IF;
      END $$;
    `);

    // Create default organization user if it doesn't exist
    const orgPassword = 'test123';
    const orgPasswordHash = await bcrypt.hash(orgPassword, 10);
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role, organization_id)
      VALUES ('orguser', 'org@cpr.com', $1, 'organization', 1)
      ON CONFLICT (username) DO NOTHING;
    `, [orgPasswordHash]);

    // Create default accountant user if it doesn't exist
    const accountantPassword = 'test123';
    const accountantPasswordHash = await bcrypt.hash(accountantPassword, 10);
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('accountant', 'accountant@cpr.com', $1, 'accountant')
      ON CONFLICT (username) DO NOTHING;
    `, [accountantPasswordHash]);

    // Create course_pricing table for organization-specific pricing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_pricing (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        course_type_id INTEGER NOT NULL REFERENCES class_types(id),
        price_per_student DECIMAL(10,2) NOT NULL,
        effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_id, course_type_id, effective_date)
      );
    `);

    // Create invoices table for billing tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        course_request_id INTEGER NOT NULL REFERENCES course_requests(id),
        amount DECIMAL(10,2) NOT NULL,
        students_billed INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        due_date DATE NOT NULL,
        paid_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create payments table for payment tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id),
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_date DATE NOT NULL,
        reference_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default course pricing if none exists
    await pool.query(`
      INSERT INTO course_pricing (organization_id, course_type_id, price_per_student)
      SELECT o.id, ct.id, 
        CASE 
          WHEN ct.name = 'Basic CPR' THEN 50.00
          WHEN ct.name = 'Advanced CPR' THEN 75.00
          WHEN ct.name = 'First Aid' THEN 45.00
          WHEN ct.name = 'BLS' THEN 85.00
          ELSE 60.00
        END as price
      FROM organizations o
      CROSS JOIN class_types ct
      WHERE NOT EXISTS (
        SELECT 1 FROM course_pricing cp 
        WHERE cp.organization_id = o.id AND cp.course_type_id = ct.id
      );
    `);

    // Add completed_at column to course_requests table if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'course_requests' AND column_name = 'completed_at'
        ) THEN 
          ALTER TABLE course_requests ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        END IF;
      END $$;
    `);

    // Create activity_logs table for audit trail
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id VARCHAR(50) NOT NULL,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on activity_logs for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id 
      ON activity_logs(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action 
      ON activity_logs(action);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
      ON activity_logs(created_at);
    `);

    // Create course_students table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_students (
        id SERIAL PRIMARY KEY,
        course_request_id INTEGER NOT NULL REFERENCES course_requests(id) ON DELETE CASCADE,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        attendance_marked BOOLEAN DEFAULT FALSE,
        attended BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on course_request_id for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_course_students_course_request_id 
      ON course_students(course_request_id);
    `);

    // Insert sample course requests for analytics (only if none exist)
    try {
      const existingRequests = await pool.query('SELECT COUNT(*) FROM course_requests');
      if (parseInt(existingRequests.rows[0].count) === 0) {
        console.log('Adding sample course requests for analytics...');
        
        // Get organization and course type IDs
        const orgResult = await pool.query('SELECT id FROM organizations LIMIT 1');
        const courseTypesResult = await pool.query('SELECT id, name FROM class_types');
        
        if (orgResult.rows.length > 0 && courseTypesResult.rows.length > 0) {
        const orgId = orgResult.rows[0].id;
        const courseTypes = courseTypesResult.rows;
        
        // Create sample requests over the past 12 months
        for (let i = 0; i < 15; i++) {
          const monthsAgo = Math.floor(Math.random() * 12);
          const daysAgo = Math.floor(Math.random() * 30);
          const requestDate = new Date();
          requestDate.setMonth(requestDate.getMonth() - monthsAgo);
          requestDate.setDate(requestDate.getDate() - daysAgo);
          
          const preferredDate = new Date(requestDate);
          preferredDate.setDate(preferredDate.getDate() + Math.floor(Math.random() * 60) + 7); // 1-9 weeks later
          
          const courseType = courseTypes[Math.floor(Math.random() * courseTypes.length)];
          const studentCount = Math.floor(Math.random() * 20) + 5; // 5-25 students
          const status = Math.random() > 0.3 ? 'completed' : (Math.random() > 0.5 ? 'confirmed' : 'pending');
          
          let scheduledDate = null;
          let completedAt = null;
          let instructorId = null;
          
          if (status === 'completed' || status === 'confirmed') {
            scheduledDate = preferredDate;
            if (!instructorId) {
              const instructorResult = await pool.query('SELECT id FROM users WHERE role = \'instructor\' LIMIT 1');
              instructorId = instructorResult.rows[0]?.id;
            }
            
            if (status === 'completed') {
              completedAt = new Date(scheduledDate);
              completedAt.setHours(completedAt.getHours() + 3); // 3 hours later
            }
          }
          
          const courseRequest = await pool.query(`
            INSERT INTO course_requests (
              organization_id, course_type_id, date_requested, preferred_date, 
              location, registered_students, notes, status, instructor_id, 
              scheduled_date, completed_at, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $3)
            RETURNING id
          `, [
            orgId, courseType.id, requestDate, preferredDate,
            `Training Room ${Math.floor(Math.random() * 5) + 1}`, studentCount,
            `Sample ${courseType.name} training request`, status, instructorId,
            scheduledDate, completedAt
          ]);
          
          // Add sample students for completed courses
          if (status === 'completed') {
            const attendanceRate = 0.7 + Math.random() * 0.25; // 70-95% attendance
            const attendedCount = Math.floor(studentCount * attendanceRate);
            
            for (let j = 0; j < studentCount; j++) {
              const attended = j < attendedCount;
              await pool.query(`
                INSERT INTO course_students (course_request_id, first_name, last_name, email, attended)
                VALUES ($1, $2, $3, $4, $5)
              `, [
                courseRequest.rows[0].id,
                `Student${j + 1}`,
                `LastName${j + 1}`,
                `student${j + 1}@example.com`,
                attended
              ]);
            }
          }
                 }
         console.log('Sample course requests and student data added successfully');
       }
     }
    } catch (error) {
      console.error('Error adding sample data:', error);
      // Continue without sample data if there's an error
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Initialize database on startup
initializeDatabase().catch(console.error);

// Custom error class for database operations
class DatabaseError extends Error {
  originalError?: unknown;
  
  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

// Function to execute queries with retry mechanism
export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  return retry(
    async () => {
      try {
        return await pool.query<T>(text, params);
      } catch (error) {
        throw new DatabaseError('Database query failed', error);
      }
    },
    {
      maxAttempts: 3,
      delay: 1000,
      factor: 2,
      jitter: true,
    }
  );
};

// Health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('Database pool has ended');
    process.exit(0);
  } catch (err) {
    console.error('Error during pool shutdown:', err);
    process.exit(1);
  }
});

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export { pool, initializeDatabase }; 