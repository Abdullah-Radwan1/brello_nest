import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Task_enums } from 'src/db/schema';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class UpdateTaskStatusDto {
  @IsEnum(Task_enums.enumValues)
  status: (typeof Task_enums.enumValues)[number];
}

export class AssignTaskDto {
  @IsUUID()
  assignee_id: string;
}
