import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Res,
  Get,
} from '@nestjs/common';
import { LocalAuthGuard } from './local.auth.guard';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import type { Request, Response } from 'express';
import { SignupDto } from './dto/auth.dto';
import { CurrentUser } from '../db/current-user.decorator';
const isProd = process.env.NODE_ENV === 'production';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard) // uses validate from LocalStrategy
  @Post('login')
  async login(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;

    // generate token
    const { access_token } = await this.authService.login({
      email: user.email,
      id: user.id,
      name: user.name,
      color: user.color,
    });

    // set cookie with the correct variable
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isProd, // must be false on localhost
      sameSite: isProd ? 'none' : 'lax', // 🔴 allow cross-site in prod
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.send({
      user: {
        email: user.email,
        name: user.name,
        id: user.id,
        color: user.color,
      },
      message: 'Logged in successfully',
    });
  }

  @Public()
  @Post('register')
  async signup(@Body() dto: SignupDto, @Res() res: Response) {
    const { user, access_token } = await this.authService.signup(dto);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: isProd ? 'none' : 'lax', // 🔴 allow cross-site in prod
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.send({
      name: user.name,
      email: user.email,
      message: 'User registered successfully',
    });
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear the HTTP-only cookie
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax', // 🔴 allow cross-site in prod
      secure: process.env.NODE_ENV === 'production',
    });

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  whoAmI(@CurrentUser() user) {
    return this.authService.whoAmI(user);
  }
}
