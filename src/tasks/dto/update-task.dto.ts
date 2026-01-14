import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsEnum, IsUUID } from 'class-validator';
import { Task_enums } from 'src/db/schema';

export class UpdateTaskStatusDto {
  @IsEnum(Task_enums.enumValues)
  status: (typeof Task_enums.enumValues)[number];
}

export class AssignTaskDto {
  @IsUUID()
  assignee_id: string;
}

import { IsOptional, IsString, IsISO8601 } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['LOW', 'NORMAL', 'URGENT'])
  @IsOptional()
  priority?: 'LOW' | 'NORMAL' | 'URGENT';

  @IsOptional()
  @IsISO8601()
  start_date?: string;

  @IsOptional()
  @IsISO8601()
  end_date?: string;

  // ❌ ممنوع status هنا
}
