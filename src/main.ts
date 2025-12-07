import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt.auth.guard.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // parse cookies so `request.cookies` is populated (used by JwtStrategy)
  app.use(cookieParser());
  app.enableCors({
    origin: ['http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown properties
      forbidNonWhitelisted: true, // throws error if unknown props sent
      transform: true, // auto-transform types
    }),
  );
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
