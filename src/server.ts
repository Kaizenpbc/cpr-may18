import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { errorHandler } from './utils/errorHandler';
import v1Routes from './routes/v1';
import authRoutes from './routes/v1/auth';
import { apiLimiter, authLimiter, registerLimiter } from './middleware/rateLimiter';
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

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());

// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', registerLimiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', v1Routes);
app.use('/api/v1/instructor', instructorRoutes);
app.use('/api/v1/holidays', holidaysRoutes);

// Protected routes
app.use('/api/v1/protected', authenticateToken);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 