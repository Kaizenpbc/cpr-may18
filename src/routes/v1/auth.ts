import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/errorHandler';
import { ApiResponseBuilder } from '../../utils/apiResponse';
import { AppError, errorCodes } from '../../utils/errorHandler';
import bcrypt from 'bcryptjs';
import pool from '../../config/database';
import { generateTokens, verifyRefreshToken } from '../../utils/jwtUtils';

const router = Router();

// Login endpoint
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Username and password are required');
  }

  console.log('Login attempt:', { username });

  try {
    console.log('Attempting database query...');
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    console.log('Query result:', result.rows.length ? 'User found' : 'User not found');

    if (result.rows.length === 0) {
      throw new AppError(401, errorCodes.AUTH_INVALID_CREDENTIALS, 'Invalid username or password');
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new AppError(401, errorCodes.AUTH_INVALID_CREDENTIALS, 'Invalid username or password');
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return success response with access token
    res.json(ApiResponseBuilder.success({
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    }));
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}));

// Logout endpoint
router.post('/logout', asyncHandler(async (_req: Request, res: Response) => {
  // Clear the refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  // Return success response
  res.json(ApiResponseBuilder.success({ message: 'Logged out successfully' }));
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError(401, errorCodes.AUTH_TOKEN_INVALID, 'No refresh token provided');
  }

  try {
    // Verify refresh token using the imported function
    const payload = verifyRefreshToken(refreshToken);
    
    // Fetch fresh user data from database to get current role
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError(401, errorCodes.AUTH_TOKEN_INVALID, 'User not found');
    }

    const user = result.rows[0];

    // Generate new tokens with current user data
    const tokens = generateTokens({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // Set new refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return success response with new access token
    res.json(ApiResponseBuilder.success({
      accessToken: tokens.accessToken
    }));
  } catch (error) {
    console.error('Refresh token error:', error);
    throw new AppError(401, errorCodes.AUTH_TOKEN_INVALID, 'Invalid refresh token');
  }
}));

export default router; 