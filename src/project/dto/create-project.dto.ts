import {
  IsString,
  MinLength,
  IsNotEmpty,
  IsArray,
  IsOptional,
} from 'class-validator';
import { InvitationInput } from 'src/db/types';

export class CreateProjectDto {
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsOptional()
  invitations: InvitationInput[];
}
