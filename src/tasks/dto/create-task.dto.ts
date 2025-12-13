import { Invitation_enums, Task_enums } from 'src/db/schema';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { TaskStatusTS } from 'src/db/types';
import type { TaskStatus } from 'src/db/types';
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatusTS)
  @IsOptional()
  status?: TaskStatus;

  @IsUUID()
  @IsNotEmpty()
  project_id: string;

  @IsUUID()
  @IsOptional()
  assignee_id?: string;
}
