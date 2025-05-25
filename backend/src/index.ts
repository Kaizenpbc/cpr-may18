import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { errorHandler } from './utils/errorHandler';
import v1Routes from './routes/v1';
import authRoutes from './routes/v1/auth';
// import { apiLimiter, authLimiter, registerLimiter } from './middleware/rateLimiter';
import { authenticateToken } from './middleware/authMiddleware';
import path from 'path';
import instructorRoutes from './routes/instructor';
import holidaysRoutes from './routes/holidays';

// Load environment variables
const result = dotenv.config();
console.log('Environment loading result:', result);
console.log('Current working directory:', process.cwd());
console.log('Environment variables:', {
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME
});

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Body parsing middleware
app.use(express.json());
app.use(cookieParser());

// JSON parsing error handler - after express.json()
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('JSON parsing error:', err);
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON payload'
      }
    });
  }
  next(err);
});

// Apply rate limiting - COMMENTED OUT FOR TESTING
// app.use('/api', apiLimiter);
// app.use('/api/v1/auth/login', authLimiter);
// app.use('/api/v1/auth/register', registerLimiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', v1Routes);

// Protected routes
app.use('/api/v1/protected', authenticateToken);
app.use('/api/v1/instructor', authenticateToken, instructorRoutes);
app.use('/api/v1/holidays', authenticateToken, holidaysRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Add comprehensive request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[REQUEST] ${new Date().toISOString()}`);
  console.log(`  Method: ${req.method}`);
  console.log(`  URL: ${req.url}`);
  console.log(`  Path: ${req.path}`);
  console.log(`  Base URL: ${req.baseUrl}`);
  console.log(`  Original URL: ${req.originalUrl}`);
  console.log(`  Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`  Query:`, req.query);
  console.log(`  Body:`, req.body || 'No body');
  
  // Log response when it's done
  const oldSend = res.send;
  res.send = function(data: any) {
    console.log(`[RESPONSE] ${req.method} ${req.originalUrl}`);
    console.log(`  Status: ${res.statusCode}`);
    console.log(`  Body preview:`, typeof data === 'string' ? data.substring(0, 200) : 'Non-string response');
    res.send = oldSend;
    return res.send(data);
  };
  
  next();
});

// List all registered routes
console.log('[ROUTES] All registered routes:');
function printRoutes(path: string, layer: any) {
  if (layer.route) {
    layer.route.stack.forEach((routeLayer: any) => {
      console.log(`  ${routeLayer.method?.toUpperCase() || 'ALL'} ${path}${layer.route.path}`);
    });
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach((stackLayer: any) => {
      printRoutes(path + (layer.regexp.source === '^\\/?$' ? '' : layer.path || ''), stackLayer);
    });
  }
}

app._router.stack.forEach((layer: any) => {
  if (layer.name === 'router') {
    printRoutes('', layer);
  }
});

// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  console.error(`[404 ERROR] Route not found: ${req.method} ${req.originalUrl}`);
  console.error(`  Available base paths: /api/v1/*`);
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      suggestion: 'Check if the route exists and the method is correct'
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 