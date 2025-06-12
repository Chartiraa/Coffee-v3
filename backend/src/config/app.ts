import dotenv from 'dotenv';
import { CorsOptions } from 'cors';
import { RateLimitRequestHandler } from 'express-rate-limit';

dotenv.config();

interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: CorsOptions;
}

export const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '236541',
    database: process.env.DB_NAME || 'coffee_v3',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100 // her IP için 15 dakikada maksimum 100 istek
  },
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3001',
        'http://localhost:3002',
        'https://admin.lerascoffee.com',
        'https://lerascoffee.com'
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS hatası: Erişim reddedildi!'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
}; 