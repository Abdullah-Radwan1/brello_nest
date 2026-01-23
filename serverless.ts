import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { Request, Response } from 'express';

// Use require here, NOT import
const serverlessExpress = require('@vendia/serverless-express');

let cachedServer: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({ origin: '*', credentials: true });
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();

  // serverlessExpress is now callable directly
  cachedServer = serverlessExpress({ app: expressApp });
}

export default async function handler(req: Request, res: Response) {
  if (!cachedServer) {
    await bootstrap();
  }
  return cachedServer(req, res);
}
