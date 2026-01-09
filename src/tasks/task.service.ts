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
  TaskSubmission,
  User,
} from 'src/db/schema';
import { and, eq } from 'drizzle-orm';
import { CreateTaskDto } from './dto/create-task.dto';
import { assertionService } from 'src/assertion/assertion.service';
import { Task_enums } from 'src/db/schema';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  ReviewTaskDTO,
  SubmitTaskForReviewDTO,
  TaskStatus,
} from './dto/submit-review.dto';

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
        note: TaskSubmission.note,
        project_id: Task.project_id,
        reject_comment: TaskReview.comment,
        assignee: {
          id: User.id,
          name: User.name,
          email: User.email,
        },
      })
      .from(Task)
      .leftJoin(User, eq(Task.assignee_id, User.id))
      .leftJoin(TaskReview, eq(Task.id, TaskReview.task_id))
      .leftJoin(TaskSubmission, eq(Task.id, TaskSubmission.task_id))
      .where(eq(Task.project_id, project_id));
  }

  async findOne(task_id: string) {
    const task = await db.select().from(Task).where(eq(Task.id, task_id));
    if (!task || !task[0]) throw new NotFoundException('Task not found');
    return task[0];
  }

  // ================= UPDATE =================
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

  // ================= STATUS =================
  async updateStatus(user_id: string, task_id: string, status: TaskStatus) {
    const task = await this.assertion.assertTaskExists(task_id);
    const role = await this.assertion.getUserRole(user_id, task.project_id);

    // Contributor rules
    if (role === 'contributor') {
      if (task.assignee_id !== user_id)
        throw new ForbiddenException('You can only update your own tasks');

      const allowedTransitions = {
        TODO: ['IN_PROGRESS'],
      };

      if (!allowedTransitions[task.status]?.includes(status)) {
        throw new ForbiddenException(
          'Invalid status transition for contributor',
        );
      }
    }

    // Manager rules
    if (role === 'manager') {
      if (task.status === 'REVIEW' && status !== 'DONE') {
        throw new ForbiddenException(
          'Managers can only approve tasks from REVIEW to DONE or reject with reviewTask',
        );
      }
    }

    const payload: any = { status };
    if (status === 'IN_PROGRESS') payload.start_date = new Date().toISOString();
    if (status === 'DONE') payload.end_date = new Date().toISOString();

    const [updated] = await db
      .update(Task)
      .set(payload)
      .where(eq(Task.id, task_id))
      .returning();
    return updated;
  }

  async submitTaskForReview(user_id: string, task_id: string, note: string) {
    const task = await this.assertion.assertTaskExists(task_id);

    if (task.assignee_id !== user_id)
      throw new ForbiddenException('Not your task');
    if (task.status !== 'IN_PROGRESS')
      throw new BadRequestException('Task must be in progress');

    await db.transaction(async (tx) => {
      // Upsert the submission
      const [existing] = await tx
        .select()
        .from(TaskSubmission)
        .where(eq(TaskSubmission.task_id, task_id));

      if (existing) {
        await tx
          .update(TaskSubmission)
          .set({ note })
          .where(eq(TaskSubmission.task_id, task_id));
      } else {
        await tx
          .insert(TaskSubmission)
          .values([{ task_id, submitted_by: user_id, note }]);
      }

      // Update task status to REVIEW
      await tx
        .update(Task)
        .set({ status: 'REVIEW' })
        .where(eq(Task.id, task_id));
    });
  }

  async reviewTask(manager_id: string, task_id: string, dto: ReviewTaskDTO) {
    const task = await this.assertion.assertTaskExists(task_id);
    await this.assertion.assertManager(manager_id, task.project_id);

    if (task.status !== 'REVIEW')
      throw new BadRequestException('Task is not under review');

    await db.transaction(async (tx) => {
      // Upsert TaskReview instead of always inserting
      const [existingReview] = await tx
        .select()
        .from(TaskReview)
        .where(eq(TaskReview.task_id, task_id));

      if (existingReview) {
        await tx
          .update(TaskReview)
          .set({
            reviewer_id: manager_id,
            status: dto.decision,
            comment: dto.reject_comment,
          })
          .where(eq(TaskReview.task_id, task_id));
      } else {
        await tx.insert(TaskReview).values([
          {
            task_id,
            reviewer_id: manager_id,
            status: dto.decision,
            comment: dto.reject_comment,
          },
        ]);
      }

      // Update task status based on decision
      await tx
        .update(Task)
        .set({
          status: dto.decision === 'APPROVED' ? 'DONE' : 'IN_PROGRESS',
        })
        .where(eq(Task.id, task_id));

      // Delete the submission after review
      await tx
        .delete(TaskSubmission)
        .where(eq(TaskSubmission.task_id, task_id));
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
