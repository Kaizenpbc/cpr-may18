import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const TEST_DB_NAME = process.env.TEST_DB_NAME || 'cpr_test_db';

async function setupTestDatabase() {
  // Connect to default postgres database to create test database
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default database
  });

  try {
    // Drop test database if it exists
    await pool.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
    
    // Create test database
    await pool.query(`CREATE DATABASE ${TEST_DB_NAME}`);
    
    console.log(`Test database ${TEST_DB_NAME} created successfully`);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error setting up test database:', error);
      process.exit(1);
    });
}

export default setupTestDatabase; 