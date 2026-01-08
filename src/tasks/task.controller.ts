// src/task/task.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';

import { CurrentUser } from 'src/db/current-user.decorator';
import {
  AssignTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
} from './dto/update-task.dto';
import { SubmitTaskReviewDto } from './dto/submit-review.dto';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // ================= CREATE =================
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateTaskDto) {
    return this.taskService.create(user.id, dto);
  }

  // ================= READ =================
  @Get()
  findAll(@Query('project_id') project_id: string) {
    return this.taskService.findAll(project_id);
  }

  @Get(':task_id')
  findOne(@Param('task_id') task_id: string) {
    return this.taskService.findOne(task_id);
  }

  // ================= UPDATE =================

  // Manager: update title / description / priority
  @Patch(':task_id/details')
  updateDetails(
    @CurrentUser() user: { id: string },
    @Param('task_id') task_id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.updateDetails(user.id, task_id, dto);
  }

  // Manager: assign task
  @Patch(':task_id/assign')
  assignTask(
    @CurrentUser() user: { id: string },
    @Param('task_id') task_id: string,
    @Body() dto: AssignTaskDto,
  ) {
    return this.taskService.assignTask(user.id, task_id, dto.assignee_id);
  }
  @Patch(':task_id/submit-for-review')
  submitForReview(
    @CurrentUser() user: { id: string },
    @Param('task_id') task_id: string,
    @Body() dto: SubmitTaskReviewDto,
  ) {
    return this.taskService.submitForReview(user.id, task_id, dto.comment);
  }
  // Manager + Contributor: update status
  @Patch(':task_id/status')
  updateStatus(
    @CurrentUser() user: { id: string },
    @Param('task_id') task_id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.taskService.updateStatus(user.id, task_id, dto.status);
  }

  // ================= DELETE =================
  @Delete(':task_id')
  remove(
    @CurrentUser() user: { id: string },
    @Param('task_id') task_id: string,
  ) {
    return this.taskService.remove(user.id, task_id);
  }
}
