import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/errorHandler';
import { ApiResponseBuilder } from '../../utils/apiResponse';
import { AppError, errorCodes } from '../../utils/errorHandler';
import bcrypt from 'bcryptjs';
import pool from '../../config/database';
import { generateTokens } from '../../utils/jwtUtils';

const router = Router();

console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

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

export default router; 