import request from 'supertest';
import { testPool } from '../setup/jest.setup';
import { app } from '../../server';

describe('Users API', () => {
  describe('GET /api/v1/users', () => {
    it('should return a list of users', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=1&limit=5')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('pagination');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return a user by id', async () => {
      // First, get a user id from the database
      const result = await testPool.query('SELECT id FROM users LIMIT 1');
      const userId = result.rows[0].id;

      const response = await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', userId);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/users/999999')
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 