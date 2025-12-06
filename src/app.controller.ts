import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt.auth.guard';

@Controller()
export class AppController {
  // Route محمية بالـ JWT
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    // req.user موجود بعد ما JwtAuthGuard يتحقق من الـ token
    return req.user;
  }

  // أي route عامة ممكن تحطها بدون Guard
  @Get()
  getHello() {
    return { message: 'Welcome to the API' };
  }
}
