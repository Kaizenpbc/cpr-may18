import { Pool } from 'pg';
import type { PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { retry } from '@lifeomic/attempt';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

// Database configuration
const poolConfig: PoolConfig = {
  user: 'postgres',
  password: 'gtacpr',
  host: 'localhost',
  port: 5432,
  database: 'cpr_may18'
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

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
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

export default pool; 