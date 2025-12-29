import { IsString, MinLength } from 'class-validator';

export class GenerateDescriptionDto {
  @IsString()
  @MinLength(3)
  title: string;
}
