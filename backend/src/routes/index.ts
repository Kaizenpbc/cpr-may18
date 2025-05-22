import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import v1Routes from './v1';

// Extend Express Request type to include apiVersion
declare global {
  namespace Express {
    interface Request {
      apiVersion: string;
    }
  }
}

const router = Router();

const apiVersionMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const version = req.headers['api-version'] || 'v1';
  req.apiVersion = version as string;
  next();
};

router.use(apiVersionMiddleware);

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// API routes
router.use('/v1', v1Routes);

// 404 handler
router.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

export default router; 