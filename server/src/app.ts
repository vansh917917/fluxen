import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';

export const createApp = () => {
  const app = express();

  // Trust first proxy for secure cookies behind AWS ALB or Nginx
  app.set('trust proxy', 1);

  // Configure CORS
  const clientUrlEnv = process.env.CLIENT_URL || 'http://localhost:5173';
  const allowedOrigins = clientUrlEnv.split(',').map((url) => url.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive origin reflection for direct IP instances with credentials
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'fluxen-api' });
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'fluxen-api' });
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Global error handler (never leaks stack traces in responses)
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err.message);
    res.status(500).json({ error: 'An unexpected internal error occurred' });
  });

  return app;
};
