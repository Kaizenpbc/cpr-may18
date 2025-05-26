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
    console.log('🚀 Starting database initialization...');

    // Create users table if it doesn't exist
    console.log('📝 Creating users table...');
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
    console.log('✅ Users table created successfully');

    // Create organizations table if it doesn't exist
    console.log('🏢 Creating organizations table...');
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
    console.log('✅ Organizations table created successfully');

    // Insert default organizations if none exist
    console.log('📊 Inserting default organizations...');
    await pool.query(`
      INSERT INTO organizations (name, contact_email, contact_phone, address)
      VALUES 
        ('Test Organization', 'test@org.com', '555-1234', '123 Main St'),
        ('Demo Company', 'demo@company.com', '555-5678', '456 Business Ave')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✅ Default organizations inserted successfully');

    // Add organization_id to users table if it doesn't exist
    console.log('🔗 Adding organization_id column to users table...');
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
    console.log('✅ Organization_id column added successfully');

    // Create default admin user if it doesn't exist
    console.log('👤 Creating default admin user...');
    const adminPassword = 'test123';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@cpr.com', $1, 'admin')
      ON CONFLICT (username) DO NOTHING;
    `, [adminPasswordHash]);
    console.log('✅ Admin user created successfully');

    // Create default instructor user if it doesn't exist
    console.log('👨‍🏫 Creating default instructor user...');
    const instructorPassword = 'test123';
    const instructorPasswordHash = await bcrypt.hash(instructorPassword, 10);
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('instructor', 'instructor@cpr.com', $1, 'instructor')
      ON CONFLICT (username) DO NOTHING;
    `, [instructorPasswordHash]);
    console.log('✅ Instructor user created successfully');

    // Create default organization user if it doesn't exist
    console.log('🏢 Creating default organization user...');
    const orgPassword = 'test123';
    const orgPasswordHash = await bcrypt.hash(orgPassword, 10);
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role, organization_id)
      VALUES ('orguser', 'org@cpr.com', $1, 'organization', 1)
      ON CONFLICT (username) DO NOTHING;
    `, [orgPasswordHash]);
    console.log('✅ Organization user created successfully');

    // Create default accountant user if it doesn't exist
    console.log('💰 Creating default accountant user...');
    const accountantPassword = 'test123';
    const accountantPasswordHash = await bcrypt.hash(accountantPassword, 10);
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('accountant', 'accountant@cpr.com', $1, 'accountant')
      ON CONFLICT (username) DO NOTHING;
    `, [accountantPasswordHash]);
    console.log('✅ Accountant user created successfully');

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

    // Create course_requests table if it doesn't exist
    console.log('📋 Creating course_requests table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_requests (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        course_type_id INTEGER NOT NULL REFERENCES class_types(id),
        date_requested DATE NOT NULL,
        scheduled_date DATE,
        location VARCHAR(255) NOT NULL,
        registered_students INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        instructor_id INTEGER REFERENCES users(id),
        confirmed_date DATE,
        confirmed_start_time TIME,
        confirmed_end_time TIME,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Course_requests table created successfully');

    // Migrate existing database: rename preferred_date to scheduled_date
    console.log('🔄 Migrating date fields...');
    await pool.query(`
      DO $$ 
      BEGIN 
        -- Add scheduled_date if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'course_requests' AND column_name = 'scheduled_date'
        ) THEN 
          ALTER TABLE course_requests ADD COLUMN scheduled_date DATE;
        END IF;

        -- Add confirmed_date columns if they don't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'course_requests' AND column_name = 'confirmed_date'
        ) THEN 
          ALTER TABLE course_requests ADD COLUMN confirmed_date DATE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'course_requests' AND column_name = 'confirmed_start_time'
        ) THEN 
          ALTER TABLE course_requests ADD COLUMN confirmed_start_time TIME;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'course_requests' AND column_name = 'confirmed_end_time'
        ) THEN 
          ALTER TABLE course_requests ADD COLUMN confirmed_end_time TIME;
        END IF;

        -- Add completed_at if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'course_requests' AND column_name = 'completed_at'
        ) THEN 
          ALTER TABLE course_requests ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        END IF;
      END $$;
    `);

    // Only migrate data if old columns exist
    console.log('🔄 Migrating data from old columns if they exist...');
    await pool.query(`
      DO $$ 
      BEGIN 
        -- Copy preferred_date to scheduled_date if preferred_date column exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'course_requests' AND column_name = 'preferred_date'
        ) THEN 
          UPDATE course_requests 
          SET scheduled_date = preferred_date 
          WHERE scheduled_date IS NULL AND preferred_date IS NOT NULL;
        END IF;

        -- Move old scheduled fields to confirmed fields if they exist
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'course_requests' AND column_name = 'scheduled_start_time'
        ) THEN 
          UPDATE course_requests 
          SET confirmed_start_time = scheduled_start_time,
              confirmed_end_time = scheduled_end_time
          WHERE confirmed_start_time IS NULL 
            AND scheduled_start_time IS NOT NULL 
            AND instructor_id IS NOT NULL;
        END IF;
      END $$;
    `);

    // Clean up old columns if they exist
    console.log('🧹 Cleaning up old columns...');
    await pool.query(`
      DO $$ 
      BEGIN 
        -- Drop preferred_date if it exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'course_requests' AND column_name = 'preferred_date'
        ) THEN 
          ALTER TABLE course_requests DROP COLUMN preferred_date;
        END IF;

        -- Drop old scheduled columns if they exist (since they're now confirmed columns)
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'course_requests' AND column_name = 'scheduled_start_time'
        ) THEN 
          ALTER TABLE course_requests DROP COLUMN scheduled_start_time;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'course_requests' AND column_name = 'scheduled_end_time'
        ) THEN 
          ALTER TABLE course_requests DROP COLUMN scheduled_end_time;
        END IF;
      END $$;
    `);
    console.log('✅ Date field migration completed');

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
        type_id INTEGER REFERENCES class_types(id),
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

    // Add status column to instructor_availability if it doesn't exist
    console.log('🔄 Ensuring status column exists in instructor_availability...');
    await pool.query(`
      DO $$ 
      BEGIN 
        -- Add status column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'instructor_availability' AND column_name = 'status'
        ) THEN 
          ALTER TABLE instructor_availability ADD COLUMN status VARCHAR(20) DEFAULT 'available';
        END IF;

        -- Update any NULL status values to 'available'
        UPDATE instructor_availability 
        SET status = 'available' 
        WHERE status IS NULL;
      END $$;
    `);
    console.log('✅ Status column migration completed');

    // Create enrollments table if it doesn't exist
    await pool.query(`
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

    console.log('🎉 [DATABASE SUCCESS] All database tables initialized successfully!');
    console.log('📊 [DATABASE INFO] Database schema setup completed');
    console.log('✅ [DATABASE READY] Database is ready for operations');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Database initialization will be called explicitly from index.ts
// initializeDatabase().catch(console.error);

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