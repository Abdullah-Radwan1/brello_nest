import { IsString, MinLength, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsUUID()
  manager_id: string;
}
