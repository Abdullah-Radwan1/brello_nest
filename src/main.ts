import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { AppModule } from './app.module.js';
import { JwtAuthGuard } from './auth/jwt.auth.guard.js';

// Register tsconfig paths for development
import 'tsconfig-paths/register';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  /* ===============================
     ✅ CORS (MUST be first)
  =============================== */
  app.enableCors({
    origin: (origin, callback) => {
      // allow server-to-server / curl / postman
      if (!origin) return callback(null, true);

      // allow localhost
      if (origin === 'http://localhost:8080') {
        return callback(null, true);
      }

      // allow all Vercel deployments (preview + prod)
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  /* ===============================
     Middleware
  =============================== */
  app.use(cookieParser());

  /* ===============================
     Global Pipes
  =============================== */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /* ===============================
     Global Auth Guard
  =============================== */
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
