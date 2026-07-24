import 'express-async-errors';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from '@config/env';
import { apiRouter } from '@routes/index';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  const corsConfig = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || origin === 'null') {
        callback(null, true);
        return;
      }

      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  };

  app.use(helmet());
  app.use(cors(corsConfig));
  app.options('*', cors(corsConfig));
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', env: env.nodeEnv });
  });

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
