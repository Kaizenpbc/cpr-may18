const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cpr_may18',
  password: 'gtacpr',
  port: 5432,
});

async function createSysAdmin() {
  try {
    const passwordHash = bcrypt.hashSync('test123', 10);
    
    const result = await pool.query(`
      INSERT INTO users (username, password_hash, email, role, full_name, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING username, role;
    `, ['sysadmin', passwordHash, 'sysadmin@cpr.com', 'sysadmin', 'System Administrator']);

    console.log('System Admin user created/updated:', result.rows[0]);
    
    // Also create vendors table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        vendor_name VARCHAR(255) NOT NULL,
        contact_first_name VARCHAR(100),
        contact_last_name VARCHAR(100),
        email VARCHAR(255),
        mobile VARCHAR(20),
        phone VARCHAR(20),
        address_street VARCHAR(255),
        address_city VARCHAR(100),
        address_province VARCHAR(100),
        address_postal_code VARCHAR(20),
        vendor_type VARCHAR(100),
        services TEXT[],
        contract_start_date DATE,
        contract_end_date DATE,
        performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
        insurance_expiry DATE,
        certification_status VARCHAR(50),
        billing_contact_email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Vendors table created/verified');
    
    // Add course_code column to class_types if it doesn't exist
    await pool.query(`
      ALTER TABLE class_types 
      ADD COLUMN IF NOT EXISTS course_code VARCHAR(10) UNIQUE,
      ADD COLUMN IF NOT EXISTS duration_hours INTEGER,
      ADD COLUMN IF NOT EXISTS prerequisites TEXT[],
      ADD COLUMN IF NOT EXISTS certification_type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS validity_period_months INTEGER,
      ADD COLUMN IF NOT EXISTS course_category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS regulatory_compliance TEXT[];
    `);
    
    console.log('Class types table enhanced');
    
    // Update existing course types with course codes if they don't have them
    await pool.query(`
      UPDATE class_types 
      SET course_code = UPPER(LEFT(name, 3)) 
      WHERE course_code IS NULL;
    `);
    
    console.log('Course codes generated for existing courses');
    
    // Add first_name and last_name columns to users table for enhanced user management
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
      ADD COLUMN IF NOT EXISTS date_onboarded DATE,
      ADD COLUMN IF NOT EXISTS date_offboarded DATE,
      ADD COLUMN IF NOT EXISTS user_comments TEXT,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
    `);
    
    console.log('Users table enhanced with additional fields');
    
  } catch (error) {
    console.error('Error creating system admin:', error);
  } finally {
    await pool.end();
  }
}

createSysAdmin(); 