import {
  IsString,
  MinLength,
  IsUUID,
  IsNotEmpty,
  IsArray,
  IsOptional,
} from 'class-validator';
import { ContributorInput } from 'src/db/types';

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
  contributors?: ContributorInput[];
}
