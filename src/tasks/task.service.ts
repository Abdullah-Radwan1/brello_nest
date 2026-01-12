import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from 'src/db/drizzle';
import {
  Activity,
  ActivityType,
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
import { TaskStatus } from './dto/submit-review.dto';
import { ReviewTaskDTO } from './dto/submit-review.dto';

@Injectable()
export class TaskService {
  constructor(private readonly assertion: assertionService) {}

  // ================= ACTIVITY =================
  private async logActivity(
    tx: any,
    payload: {
      user_id: string;
      user_name: string;
      project_id: string;
      type: ActivityType;
      entity_id: string;
      metadata?: Record<string, any>;
    },
  ) {
    await tx.insert(Activity).values({
      user_id: payload.user_id,
      project_id: payload.project_id,
      type: payload.type,
      entity_type: 'task',
      entity_id: payload.entity_id,
      metadata: {
        actor_name: payload.user_name,
        ...payload.metadata,
      },
    });
  }

  // ================= CREATE =================
  async create(user_id: string, user_name: string, dto: CreateTaskDto) {
    await this.assertion.assertManager(user_id, dto.project_id);

    return db.transaction(async (tx) => {
      const [task] = await tx.insert(Task).values(dto).returning();

      await this.logActivity(tx, {
        user_id,
        user_name,
        project_id: dto.project_id,
        type: 'TASK_CREATED',
        entity_id: task.id,
        metadata: { title: task.title },
      });

      if (task.assignee_id) {
        await tx.insert(Notification).values({
          user_id: task.assignee_id,
          type: 'TASK_ASSIGNED',
          message: `${user_name} assigned you to task "${task.title}"`,
          link: `/projects/${task.project_id}/tasks/${task.id}`,
        });
      }

      return task;
    });
  }

  // ================= READ =================
  async findAll(project_id: string) {
    if (!project_id) throw new NotFoundException('project_id is required');

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
    if (!task[0]) throw new NotFoundException('Task not found');
    return task[0];
  }

  // ================= ASSIGN =================
  async assignTask(
    user_id: string,
    user_name: string,
    task_id: string,
    assigneeId: string,
  ) {
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
      message: `${user_name} assigned you to task "${updated.title}"`,
      link: `/projects/${task.project_id}/tasks/${task.id}`,
    });

    return updated;
  }

  // ================= STATUS =================
  async updateStatus(
    user_id: string,
    user_name: string,
    task_id: string,
    status: TaskStatus,
  ) {
    const task = await this.assertion.assertTaskExists(task_id);
    const role = await this.assertion.getUserRole(user_id, task.project_id);

    if (role === 'contributor' && task.assignee_id !== user_id) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    const payload: any = { status };
    if (status === 'IN_PROGRESS') payload.start_date = new Date().toISOString();
    if (status === 'DONE') payload.end_date = new Date().toISOString();

    const [updated] = await db
      .update(Task)
      .set(payload)
      .where(eq(Task.id, task_id))
      .returning();

    if (task.assignee_id && task.assignee_id !== user_id) {
      await db.insert(Notification).values({
        user_id: task.assignee_id,
        type: 'TASK_STATUS_UPDATED',
        message: `${user_name} updated task "${updated.title}" to ${status}`,
        link: `/projects/${task.project_id}/tasks/${task.id}`,
      });
    }

    return updated;
  }

  // ================= SUBMIT FOR REVIEW =================
  async submitTaskForReview(
    user_id: string,
    user_name: string,
    task_id: string,
    note: string,
  ) {
    const task = await this.assertion.assertTaskExists(task_id);

    if (task.assignee_id !== user_id)
      throw new ForbiddenException('Not your task');
    if (task.status !== 'IN_PROGRESS')
      throw new BadRequestException('Task must be in progress');

    await db.transaction(async (tx) => {
      await tx
        .insert(TaskSubmission)
        .values({ task_id, submitted_by: user_id, note })
        .onConflictDoUpdate({
          target: TaskSubmission.task_id,
          set: { note },
        });

      await tx
        .update(Task)
        .set({ status: 'REVIEW' })
        .where(eq(Task.id, task_id));

      const managers = await tx
        .select()
        .from(Contributor)
        .where(
          and(
            eq(Contributor.project_id, task.project_id),
            eq(Contributor.role, 'manager'),
          ),
        );

      for (const manager of managers) {
        await tx.insert(Notification).values({
          read: false,
          user_id: manager.user_id,
          type: 'TASK_SUBMITTED',
          message: `${user_name} submitted task "${task.title}" for review`,
          link: `/projects/${task.project_id}/tasks/${task.id}`,
        });
      }
    });
  }

  // ================= REVIEW =================
  async reviewTask(
    manager_id: string,
    manager_name: string,
    task_id: string,
    dto: ReviewTaskDTO,
  ) {
    const task = await this.assertion.assertTaskExists(task_id);
    await this.assertion.assertManager(manager_id, task.project_id);

    if (task.status !== 'REVIEW')
      throw new BadRequestException('Task is not under review');

    await db.transaction(async (tx) => {
      await tx
        .insert(TaskReview)
        .values({
          task_id,
          reviewer_id: manager_id,
          status: dto.decision,
          comment: dto.reject_comment,
        })
        .onConflictDoUpdate({
          target: TaskReview.task_id,
          set: {
            reviewer_id: manager_id,
            status: dto.decision,
            comment: dto.reject_comment,
          },
        });

      const newStatus = dto.decision === 'APPROVED' ? 'DONE' : 'IN_PROGRESS';

      await tx
        .update(Task)
        .set({ status: newStatus })
        .where(eq(Task.id, task_id));

      await tx
        .delete(TaskSubmission)
        .where(eq(TaskSubmission.task_id, task_id));

      if (task.assignee_id) {
        await tx.insert(Notification).values({
          user_id: task.assignee_id,
          type: 'TASK_REVIEWED',
          message:
            dto.decision === 'APPROVED'
              ? `${manager_name} approved task "${task.title}"`
              : `${manager_name} rejected task "${task.title}": ${dto.reject_comment}`,
          link: `/projects/${task.project_id}/tasks/${task.id}`,
        });
      }
    });
  }

  // ================= DELETE =================
  async remove(user_id: string, user_name: string, task_id: string) {
    const task = await this.assertion.assertTaskExists(task_id);
    await this.assertion.assertManager(user_id, task.project_id);

    const [deleted] = await db
      .delete(Task)
      .where(eq(Task.id, task_id))
      .returning();

    if (deleted?.assignee_id) {
      await db.insert(Notification).values({
        user_id: deleted.assignee_id,
        type: 'TASK_REMOVED',
        message: `${user_name} removed task "${deleted.title}"`,
        link: `/projects/${task.project_id}/tasks`,
      });
    }

    return deleted;
  }
}
