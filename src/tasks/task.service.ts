// src/task/task.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from 'src/db/drizzle';
import {
  Contributor,
  Notification,
  Task,
  TaskReview,
  User,
} from 'src/db/schema';
import { and, eq } from 'drizzle-orm';
import { CreateTaskDto } from './dto/create-task.dto';
import { assertionService } from 'src/assertion/assertion.service';
import { Task_enums } from 'src/db/schema';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly assertion: assertionService) {}

  // ================= CREATE =================
  async create(user_id: string, dto: CreateTaskDto) {
    await this.assertion.assertManager(user_id, dto.project_id);

    const [task] = await db.insert(Task).values(dto).returning();

    if (task.assignee_id) {
      await db.insert(Notification).values({
        user_id: task.assignee_id,
        type: 'TASK_ASSIGNED',
        message: `You have been assigned to task "${task.title}"`,
        link: `/projects/${task.project_id}/tasks/${task.id}`,
      });
    }

    return task;
  }

  // ================= READ =================
  async findAll(project_id: string) {
    if (!project_id) {
      throw new NotFoundException('project_id is required');
    }

    return db
      .select({
        id: Task.id,
        title: Task.title,
        description: Task.description,
        status: Task.status,
        priority: Task.priority,
        start_date: Task.start_date,
        end_date: Task.end_date,
        project_id: Task.project_id,
        assignee: {
          id: User.id,
          name: User.name,
          email: User.email,
        },
      })
      .from(Task)
      .leftJoin(User, eq(Task.assignee_id, User.id))
      .where(eq(Task.project_id, project_id));
  }

  async findOne(task_id: string) {
    const [task] = await db.select().from(Task).where(eq(Task.id, task_id))[0];

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  // ================= UPDATE =================

  // Manager only
  async updateDetails(user_id: string, task_id: string, dto: UpdateTaskDto) {
    const task = await this.assertion.assertTaskExists(task_id);

    await this.assertion.assertManager(user_id, task.project_id);

    const [updated] = await db
      .update(Task)
      .set(dto)
      .where(eq(Task.id, task_id))
      .returning();

    return updated;
  }

  // Manager only
  async assignTask(user_id: string, task_id: string, assigneeId: string) {
    const task = await this.assertion.assertTaskExists(task_id);

    await this.assertion.assertManager(user_id, task.project_id);

    await this.assertion.assertContributor(assigneeId, task.project_id);

    const [updated] = await db
      .update(Task)
      .set({ assignee_id: assigneeId })
      .where(eq(Task.id, task_id))
      .returning();

    await db.insert(Notification).values({
      user_id: assigneeId,
      type: 'TASK_ASSIGNED',
      message: `You have been assigned to task "${updated.title}"`,
      link: `/projects/${task.project_id}/tasks/${task.id}`,
    });

    return updated;
  }

  // Manager + Contributor
  async updateStatus(
    user_id: string,
    task_id: string,
    status: (typeof Task_enums.enumValues)[number],
  ) {
    const task = await this.assertion.assertTaskExists(task_id);

    const role = await this.assertion.getUserRole(user_id, task.project_id);

    // Contributor rules
    if (role === 'contributor') {
      if (task.assignee_id !== user_id) {
        throw new ForbiddenException('You can only update your own tasks');
      }

      const allowedTransitions = {
        TODO: ['IN_PROGRESS'],
        IN_PROGRESS: ['REVIEW'],
      };

      if (!allowedTransitions[task.status]?.includes(status)) {
        throw new ForbiddenException('Invalid status transition');
      }
    }

    // Manager rules
    if (role === 'manager' && task.status === 'REVIEW' && status !== 'DONE') {
      throw new ForbiddenException('Managers can only approve tasks');
    }

    const payload: any = { status };

    if (status === 'IN_PROGRESS') {
      payload.start_date = new Date().toISOString();
    }

    if (status === 'DONE') {
      payload.end_date = new Date().toISOString();
    }

    const [updated] = await db
      .update(Task)
      .set(payload)
      .where(eq(Task.id, task_id))
      .returning();

    return updated;
  }
  async submitForReview(user_id: string, task_id: string, comment: string) {
    const result = await db
      .select({ assignee_id: Task.assignee_id, status: Task.status })
      .from(Task)
      .where(eq(Task.id, task_id));
    const task = result[0];
    console.log(task);

    if (task.assignee_id !== user_id) {
      throw new ForbiddenException('it is not your task to submit');
    }

    if (task.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Task must be in progress');
    }

    if (!comment.trim()) {
      throw new BadRequestException('Comment is required');
    }

    await db.transaction(async (tx) => {
      await tx
        .update(Task)
        .set({ status: 'REVIEW' })
        .where(eq(Task.id, task_id));

      await tx.insert(TaskReview).values({
        task_id: task_id,
        reviewer_id: user_id,
        comment,
      });
    });
  }

  // ================= DELETE =================
  async remove(user_id: string, task_id: string) {
    const task = await this.assertion.assertTaskExists(task_id);

    await this.assertion.assertManager(user_id, task.project_id);

    const [deleted] = await db
      .delete(Task)
      .where(eq(Task.id, task_id))
      .returning();

    return deleted;
  }
}
