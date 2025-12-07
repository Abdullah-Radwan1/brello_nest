import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // تستخدم مع LocalStrategy
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return user; // ده هيتحط في req.user
  }

  // تستخدم بعد نجاح LocalStrategy
  async login({
    name,
    email,
    id,
  }: {
    name: string;
    email: string;
    id: string;
  }) {
    return {
      access_token: this.jwtService.sign({ name, id, email }),
    };
  }

  async signup({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) {
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }
    const createdUser = await this.usersService.create({
      name,
      email,
      password,
    })[0];
    return {
      access_token: this.jwtService.sign({
        name: createdUser.name,
        id: createdUser.id,
        email: createdUser.email,
      }),
      message: 'User registered successfully',
    };
  }
}
