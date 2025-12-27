import {
  IsString,
  MinLength,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ProjectIconEnum } from 'src/db/schema';
import { InvitationInput } from 'src/db/types';
import type { ProjectIconType } from 'src/db/schema';
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
