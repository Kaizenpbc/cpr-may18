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
import { initializeDatabase } from './config/database';

console.log('🚀 [STARTUP] Starting backend server initialization...');

// Load environment variables
console.log('📝 [STARTUP] Loading environment variables...');
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

console.log('🔧 [STARTUP] Creating Express app...');
const app = express();

console.log('🌐 [STARTUP] Setting up CORS configuration...');
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

console.log('📦 [STARTUP] Setting up middleware...');
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

console.log('🛣️ [STARTUP] Setting up routes...');
// Routes
try {
  console.log('   - Setting up auth routes...');
  app.use('/api/v1/auth', authRoutes);
  
  console.log('   - Setting up v1 routes...');
  app.use('/api/v1', v1Routes);

  console.log('   - Setting up protected routes...');
  // Protected routes
  app.use('/api/v1/protected', authenticateToken);
  app.use('/api/v1/instructor', authenticateToken, instructorRoutes);
  app.use('/api/v1/holidays', authenticateToken, holidaysRoutes);

  console.log('✅ [STARTUP] All routes configured successfully');
} catch (error) {
  console.error('❌ [STARTUP ERROR] Failed to set up routes:', error);
  process.exit(1);
}

console.log('🏥 [STARTUP] Setting up health check...');
// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

console.log('📊 [STARTUP] Setting up request logging middleware...');
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

console.log('📋 [STARTUP] Listing all registered routes...');
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

try {
  app._router.stack.forEach((layer: any) => {
    if (layer.name === 'router') {
      printRoutes('', layer);
    }
  });
  console.log('✅ [STARTUP] Route listing completed');
} catch (error) {
  console.error('❌ [STARTUP ERROR] Failed to list routes:', error);
}

console.log('🚫 [STARTUP] Setting up 404 handler...');
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

console.log('⚠️ [STARTUP] Setting up error handler...');
// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

console.log(`🚀 [STARTUP] Starting server on port ${PORT}...`);
try {
  const server = app.listen(PORT, async () => {
    console.log(`✅ [SUCCESS] Server running on port ${PORT}`);
    console.log(`🌐 [SUCCESS] Backend available at: http://localhost:${PORT}`);
    console.log(`🏥 [SUCCESS] Health check: http://localhost:${PORT}/health`);
    console.log(`📡 [SUCCESS] API base: http://localhost:${PORT}/api/v1`);
    
    // Initialize database after server starts
    console.log('🗄️ [STARTUP] Initializing database...');
    try {
      await initializeDatabase();
      console.log('✅ [DATABASE SUCCESS] Database initialization completed successfully!');
      console.log('🎉 [SUCCESS] Backend startup completed successfully!');
      console.log('🚀 [READY] Backend is ready to accept requests!');
    } catch (error) {
      console.error('❌ [DATABASE ERROR] Failed to initialize database:', error);
      console.error('💥 [CRITICAL] Backend may not function properly without database!');
      console.error('🔧 [SUGGESTION] Check database connection and credentials');
    }
  });

  server.on('error', (error: any) => {
    console.error('❌ [SERVER ERROR] Failed to start server:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ [SERVER ERROR] Port ${PORT} is already in use`);
      console.error('💡 [SUGGESTION] Try stopping other processes or use a different port');
    }
    process.exit(1);
  });

} catch (error) {
  console.error('❌ [STARTUP ERROR] Failed to start server:', error);
  process.exit(1);
} 