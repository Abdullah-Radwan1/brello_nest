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
import { CurrentUser } from '../db/current-user.decoratororator';
import {
  AssignTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
} from './dto/update-task.dto';
import { ReviewTaskDTO, SubmitTaskForReviewDTO } from './dto/submit-review.dto';

type AuthUser = {
  id: string;
  name: string;
};

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // ================= CREATE =================
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.taskService.create(user.id, user.name, dto);
  }

  // ================= READ =================
  @Get()
  findAll(@Query('project_id') project_id: string) {
    return this.taskService.findAll(project_id);
  }

  @Get(':task_id')
  findOne(@CurrentUser() user, @Param('task_id') task_id: string) {
    return this.taskService.findOne(user.id, task_id);
  }

  // ================= UPDATE =================

  // update task details / status
  @Patch(':task_id/details')
  updateDetails(
    @CurrentUser() user: AuthUser,
    @Param('task_id') task_id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.updateDetails(user.id, user.name, task_id, dto);
  }

  // assign task
  @Patch(':task_id/assign')
  assignTask(
    @CurrentUser() user: AuthUser,
    @Param('task_id') task_id: string,
    @Body() dto: AssignTaskDto,
  ) {
    return this.taskService.assignTask(
      user.id,
      user.name,
      task_id,
      dto.assignee_id,
    );
  }

  // ================= REVIEW FLOW =================

  // Contributor: submit task for review
  @Patch(':task_id/submit-for-review')
  submitForReview(
    @CurrentUser() user: AuthUser,
    @Param('task_id') task_id: string,
    @Body() dto: SubmitTaskForReviewDTO,
  ) {
    return this.taskService.submitTaskForReview(
      user.id,
      user.name,
      task_id,
      dto.note,
    );
  }

  // Manager: approve or reject task
  @Patch(':task_id/review-task')
  reviewTask(
    @CurrentUser() user: AuthUser,
    @Param('task_id') task_id: string,
    @Body() dto: ReviewTaskDTO,
  ) {
    return this.taskService.reviewTask(user.id, user.name, task_id, dto);
  }

  // Contributor or Manager: simple status updates (no review)
  @Patch(':task_id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('task_id') task_id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.taskService.updateStatus(
      user.id,
      user.name,
      task_id,
      dto.status,
    );
  }

  // ================= DELETE =================
  @Delete(':task_id')
  remove(@CurrentUser() user: AuthUser, @Param('task_id') task_id: string) {
    return this.taskService.remove(user.id, user.name, task_id);
  }
}
