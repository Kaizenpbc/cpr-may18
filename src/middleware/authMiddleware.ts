import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, generateTokens } from '../utils/jwtUtils';
import { extractTokenFromHeader } from '../utils/jwtUtils';
import pool from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role?: string;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req);
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    // If access token is invalid, try to refresh
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      
      // Fetch fresh user data from database to get current role
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [payload.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      const user = result.rows[0];
      
      const tokens = generateTokens({
        userId: user.id,
        username: user.username,
        role: user.role
      });
      
      // Set new tokens
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.setHeader('Authorization', `Bearer ${tokens.accessToken}`);
      req.user = {
        userId: user.id,
        username: user.username,
        role: user.role
      };
      next();
    } catch (error) {
      console.error('Auth middleware refresh error:', error);
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
  }
}; 