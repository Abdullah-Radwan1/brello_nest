import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { JwtAuthGuard } from './auth/jwt.auth.guard.js';

import 'tsconfig-paths/register';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  // -------------------------
  // Security & Middlewares
  // -------------------------
  app.use(helmet());
  app.use(cookieParser());

  // -------------------------
  // CORS CONFIG (FIXED)
  // -------------------------
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL, // e.g. https://myapp.vercel.app
        'http://localhost:3000',
        'http://localhost:8080',
      ].filter(Boolean);

      // ✅ Allow non-browser requests
      // (Postman, curl, SSR, cron jobs, health checks)
      if (!origin) {
        return callback(null, true);
      }

      // ✅ Exact match
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // ✅ Allow all Vercel preview domains (optional)
      if (/\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // ❌ Block everything else
      return callback(new Error(`CORS blocked: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
  });

  // -------------------------
  // Global Validation
  // -------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // -------------------------
  // Global JWT Guard
  // -------------------------
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // -------------------------
  // Start Server
  // -------------------------
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
