import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, generateTokens } from '../utils/jwtUtils';
import { extractTokenFromHeader } from '../utils/jwtUtils';
import { ApiResponseBuilder } from '../utils/apiResponse';
import { errorCodes } from '../utils/errorHandler';

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
  console.log('[Debug] authMiddleware - Authenticating request:', req.path);
  console.log('[Debug] authMiddleware - Headers:', req.headers);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).send();
  }

  const token = extractTokenFromHeader(req);
  console.log('[Debug] authMiddleware - Extracted token:', token ? 'present' : 'not present');
  
  if (!token) {
    console.log('[Debug] authMiddleware - No token provided');
    // Try to refresh using refresh token
    const refreshToken = req.cookies.refreshToken;
    console.log('[Debug] authMiddleware - Refresh token from cookies:', refreshToken ? 'present' : 'not present');
    
    if (!refreshToken) {
      console.log('[Debug] authMiddleware - No refresh token found');
      return res.status(401).json(ApiResponseBuilder.error(errorCodes.AUTH_TOKEN_INVALID, 'No token provided'));
    }

    try {
      console.log('[Debug] authMiddleware - Attempting refresh with cookie token');
      const payload = verifyRefreshToken(refreshToken);
      console.log('[Debug] authMiddleware - Refresh token valid for user:', payload.username);
      
      const tokens = generateTokens({
        userId: payload.userId,
        username: payload.username
      });
      console.log('[Debug] authMiddleware - Generated new tokens');
      
      // Set new tokens
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Changed from 'strict' to 'lax' to allow cross-site requests
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Set user for this request
      req.user = payload;
      
      // Set new access token in response header
      res.setHeader('Authorization', `Bearer ${tokens.accessToken}`);
      
      console.log('[Debug] authMiddleware - Token refresh successful');
      // Continue with the request
      return next();
    } catch (error) {
      console.error('[Debug] authMiddleware - Refresh token invalid:', error);
      // Clear the invalid refresh token
      res.clearCookie('refreshToken');
      return res.status(401).json(ApiResponseBuilder.error(errorCodes.AUTH_TOKEN_INVALID, 'Invalid refresh token'));
    }
  }

  try {
    console.log('[Debug] authMiddleware - Verifying access token');
    const payload = verifyAccessToken(token);
    req.user = payload;
    console.log('[Debug] authMiddleware - Token verified successfully for user:', payload.username);
    next();
  } catch (error) {
    console.error('[Debug] authMiddleware - Access token invalid:', error);
    // If access token is invalid, try to refresh
    const refreshToken = req.cookies.refreshToken;
    console.log('[Debug] authMiddleware - Refresh token from cookies:', refreshToken ? 'present' : 'not present');
    
    if (!refreshToken) {
      console.log('[Debug] authMiddleware - No refresh token found');
      return res.status(401).json(ApiResponseBuilder.error(errorCodes.AUTH_TOKEN_INVALID, 'Invalid token'));
    }

    try {
      console.log('[Debug] authMiddleware - Verifying refresh token');
      const payload = verifyRefreshToken(refreshToken);
      console.log('[Debug] authMiddleware - Refresh token valid for user:', payload.username);
      
      const tokens = generateTokens({
        userId: payload.userId,
        username: payload.username
      });
      console.log('[Debug] authMiddleware - Generated new tokens');
      
      // Set new tokens
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Changed from 'strict' to 'lax' to allow cross-site requests
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Set user for this request
      req.user = payload;
      
      // Set new access token in response header
      res.setHeader('Authorization', `Bearer ${tokens.accessToken}`);
      
      console.log('[Debug] authMiddleware - Token refresh successful');
      // Continue with the request
      next();
    } catch (error) {
      console.error('[Debug] authMiddleware - Refresh token invalid:', error);
      // Clear the invalid refresh token
      res.clearCookie('refreshToken');
      return res.status(401).json(ApiResponseBuilder.error(errorCodes.AUTH_TOKEN_INVALID, 'Invalid refresh token'));
    }
  }
}; 