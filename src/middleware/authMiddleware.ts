import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, generateTokens } from '../utils/jwtUtils';
import { extractTokenFromHeader } from '../utils/jwtUtils';

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
      const tokens = generateTokens(payload);
      
      // Set new tokens
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.setHeader('Authorization', `Bearer ${tokens.accessToken}`);
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
  }
}; 