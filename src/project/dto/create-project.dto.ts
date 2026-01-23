import {
  IsString,
  MinLength,
  IsNotEmpty,
  IsArray,
  IsOptional,
} from 'class-validator';

import { InvitationInput } from '../../db/types';
import type { ProjectIconType } from '../../db/schema';
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

  @IsNotEmpty()
  icon: ProjectIconType;
}
