import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import type { UserColorType } from 'src/db/schema';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  current_password?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  new_password?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  confirm_new_password?: string;

  @IsOptional()
  @IsBoolean()
  allow_invitations?: boolean;

  @IsOptional()
  color: UserColorType;
}
