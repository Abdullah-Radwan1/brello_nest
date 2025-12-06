import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './local.auth.guard';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // LOGIN ROUTE → Public
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('signin')
  async login(@Body() LoginDto: LoginDto) {
    // The LocalAuthGuard will validate the email/password
    // The user object will be attached to the request by the guard
    // Note: req.user is now accessible in the guard, not in the body
    return this.authService.login(LoginDto);
  }
}
