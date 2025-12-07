import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt.auth.guard';

@Controller()
export class AppController {
  constructor() {}
  @Get()
  getHello() {
    return { message: 'Welcome to the API' };
  }
}
