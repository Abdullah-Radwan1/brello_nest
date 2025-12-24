import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { TaskPriorityTs, TaskStatusTS } from 'src/db/types';
import type { TaskPriority, TaskStatus } from 'src/db/types';
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsEnum(TaskStatusTS)
  @IsOptional()
  status?: 'TODO';

  @IsEnum(TaskPriorityTs)
  priority: TaskPriority; // ✅ FIXED (NOT string)

  @IsString()
  @IsOptional()
  start_date?: string;

  @IsString()
  @IsOptional()
  end_date?: string;

  @IsUUID()
  @IsNotEmpty()
  project_id: string;

  @IsUUID()
  @IsOptional()
  assignee_id?: string;
}
