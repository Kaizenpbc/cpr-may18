import { Pool } from 'pg';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

dotenv.config();

const TEST_DB_NAME = process.env.TEST_DB_NAME || 'cpr_test_db';

interface TestUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

async function seedTestData() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: TEST_DB_NAME,
  });

  try {
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Generate and insert test users
    const testUsers: TestUser[] = Array.from({ length: 10 }, () => ({
      id: faker.number.int({ min: 1, max: 1000 }),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password_hash: faker.internet.password(),
      created_at: faker.date.past(),
    }));

    for (const user of testUsers) {
      await pool.query(
        `INSERT INTO users (username, email, password_hash, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO NOTHING`,
        [user.username, user.email, user.password_hash, user.created_at]
      );
    }

    // Add a known instructor user
    const bcrypt = await import('bcryptjs');
    const instructorPasswordHash = await bcrypt.hash('test123', 10);
    const instructorUser: TestUser = {
      id: 10001,
      username: 'instructor',
      email: 'instructor@example.com',
      password_hash: instructorPasswordHash,
      created_at: new Date(),
    };
    await pool.query(
      `INSERT INTO users (username, email, password_hash, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      [instructorUser.username, instructorUser.email, instructorUser.password_hash, instructorUser.created_at]
    );

    console.log('Test data seeded successfully');
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error seeding test data:', error);
      process.exit(1);
    });
}

export default seedTestData; 