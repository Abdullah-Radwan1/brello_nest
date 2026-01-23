import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../db/drizzle';
import {
  Activity,
  ActivityType,
  Contributor,
  Notification,
  Project,
  Task,
  TaskReview,
  TaskSubmission,
  User,
} from 'src/db/schema';
import { and, eq } from 'drizzle-orm';
import { CreateTaskDto } from './dto/create-task.dto';
import { assertionService } from 'src/assertion/assertion.service';
import { TaskStatus, TaskStatusTS } from './dto/submit-review.dto';
import { ReviewTaskDTO } from './dto/submit-review.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

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
          link: `/project/${task.project_id}/task/${task.id}`,
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
          // email: User.email,
        },
      })
      .from(Task)
      .leftJoin(User, eq(Task.assignee_id, User.id))
      .leftJoin(TaskReview, eq(Task.id, TaskReview.task_id))
      .leftJoin(TaskSubmission, eq(Task.id, TaskSubmission.task_id))
      .where(eq(Task.project_id, project_id));
  }

  async findOne(user_id: string, task_id: string) {
    const [row] = await db
      .select({
        // ===== Task =====
        id: Task.id,
        title: Task.title,
        description: Task.description,
        status: Task.status,
        priority: Task.priority,
        start_date: Task.start_date,
        end_date: Task.end_date,
        createdAt: Task.createdAt,

        // ===== Assignee =====
        assignee_id: Task.assignee_id,
        assignee_name: User.name,

        // ===== Project / Role =====
        project_id: Task.project_id,
        project_manager_id: Project.manager_id,
        contributor_role: Contributor.role,

        // ===== Submission =====
        submission_note: TaskSubmission.note,
        submission_created_at: TaskSubmission.createdAt,

        // ===== Review =====
        review_status: TaskReview.status,
        review_comment: TaskReview.comment,
        review_created_at: TaskReview.createdAt,
        reviewer_id: TaskReview.reviewer_id,
      })
      .from(Task)
      .leftJoin(User, eq(User.id, Task.assignee_id))
      .leftJoin(Project, eq(Project.id, Task.project_id))
      .leftJoin(
        Contributor,
        and(
          eq(Contributor.project_id, Task.project_id),
          eq(Contributor.user_id, user_id),
        ),
      )
      .leftJoin(TaskSubmission, eq(TaskSubmission.task_id, Task.id))
      .leftJoin(TaskReview, eq(TaskReview.task_id, Task.id))
      .where(eq(Task.id, task_id));

    if (!row) throw new NotFoundException('Task not found');

    // ===== Permission Resolution =====
    const isProjectManager = row.project_manager_id === user_id;
    const isManagerContributor = row.contributor_role === 'manager';
    const isManager = isProjectManager || isManagerContributor;
    const isOwner = row.assignee_id === user_id;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      start_date: row.start_date,
      end_date: row.end_date,
      createdAt: row.createdAt,
      project_id: row.project_id,

      assignee: row.assignee_id
        ? {
            id: row.assignee_id,
            name: row.assignee_name,
          }
        : null,

      // 🔥 NEW
      submission: row.submission_note
        ? {
            note: row.submission_note,
            createdAt: row.submission_created_at,
          }
        : null,

      review: row.review_status
        ? {
            status: row.review_status,
            comment: row.review_comment,
            reviewer_id: row.reviewer_id,
            createdAt: row.review_created_at,
          }
        : null,

      permissions: {
        isManager,
        isOwner,
        canEdit: isManager,
        canDelete: isProjectManager,
        canChangeStatus: isManager || isOwner,
        canSubmitForReview: isOwner && row.status === 'IN_PROGRESS',
        canReview: isManager && row.status === 'REVIEW',
      },
    };
  }

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

    // 🔔 Notification
    await db.insert(Notification).values({
      user_id: assigneeId,
      type: 'TASK_ASSIGNED',
      message: `${user_name} assigned you to task "${updated.title}"`,
      link: `/project/${task.project_id}/task/${task.id}`,
    });

    // 📌 Activity
    await db.insert(Activity).values({
      user_id,
      project_id: task.project_id,
      type: 'TASK_ASSIGNED',
      entity_type: 'task',
      entity_id: task.id,
      metadata: {
        assigneeId,
      },
    });

    return updated;
  }

  async updateDetails(
    user_id: string,
    user_name: string,
    task_id: string,
    dto: UpdateTaskDto,
  ) {
    const task = await this.assertion.assertTaskExists(task_id);
    const role = await this.assertion.getUserRole(user_id, task.project_id);

    if (role === 'contributor' && task.assignee_id !== user_id) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    const changes: Record<string, any> = {};
    for (const key of Object.keys(dto)) {
      if ((task as any)[key] !== (dto as any)[key]) {
        changes[key] = {
          from: (task as any)[key],
          to: (dto as any)[key],
        };
      }
    }

    const [updated] = await db
      .update(Task)
      .set(dto)
      .where(eq(Task.id, task_id))
      .returning();

    if (Object.keys(changes).length > 0) {
      await db.insert(Activity).values({
        user_id,
        project_id: task.project_id,
        type: 'TASK_UPDATED',
        entity_type: 'task',
        entity_id: task.id,
        metadata: {
          actor_name: user_name,
          changes,
        },
      });
    }

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

    const payload: any = { status };

    if (status === 'IN_PROGRESS') payload.start_date = new Date().toISOString();
    if (status === 'DONE') payload.end_date = new Date().toISOString();

    const [updated] = await db
      .update(Task)
      .set(payload)
      .where(eq(Task.id, task_id))
      .returning();

    // 📌 Activity
    await db.insert(Activity).values({
      user_id,
      project_id: task.project_id,
      type: 'TASK_STATUS_CHANGED',
      entity_type: 'task',
      entity_id: task.id,
      metadata: {
        actor_name: user_name,
        from: task.status,
        to: status,
      },
    });

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

      // 🔔 Notifications
      for (const manager of managers) {
        await tx.insert(Notification).values({
          user_id: manager.user_id,
          type: 'TASK_SUBMITTED',
          message: `${user_name} submitted task "${task.title}" for review`,
          link: `/project/${task.project_id}/task/${task.id}`,
        });
      }

      // 📌 Activity
      await tx.insert(Activity).values({
        user_id,
        project_id: task.project_id,
        type: 'TASK_STATUS_CHANGED',
        entity_type: 'task',
        entity_id: task.id,
        metadata: {
          note,
        },
      });
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

    if (task.status !== 'REVIEW') {
      throw new BadRequestException('Task is not under review');
    }

    await db.transaction(async (tx) => {
      // 1️⃣ Upsert review
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

      // 2️⃣ Resolve new status
      const newStatus = dto.decision === 'APPROVED' ? 'DONE' : 'IN_PROGRESS';

      // 3️⃣ Update task status
      await tx
        .update(Task)
        .set({ status: newStatus })
        .where(eq(Task.id, task_id));

      // 4️⃣ Remove submission
      await tx
        .delete(TaskSubmission)
        .where(eq(TaskSubmission.task_id, task_id));

      // 5️⃣ Notification
      if (task.assignee_id) {
        await tx.insert(Notification).values({
          user_id: task.assignee_id,
          type: 'TASK_REVIEWED',
          message:
            dto.decision === 'APPROVED'
              ? `${manager_name} approved task "${task.title}"`
              : `${manager_name} rejected task "${task.title}": ${dto.reject_comment}`,
          link: `/project/${task.project_id}/task/${task.id}`,
        });
      }

      // 6️⃣ Activity (🔥 THIS IS THE IMPORTANT PART)
      await tx.insert(Activity).values({
        user_id: manager_id,
        project_id: task.project_id,
        type: 'TASK_STATUS_CHANGED',
        entity_type: 'task',
        entity_id: task.id,
        metadata: {
          from: 'REVIEW',
          to: newStatus,
          decision: dto.decision,
          ...(dto.reject_comment && {
            comment: dto.reject_comment,
          }),
        },
      });
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

    // 🔔 Notification
    if (deleted?.assignee_id) {
      await db.insert(Notification).values({
        user_id: deleted.assignee_id,
        type: 'TASK_REMOVED',
        message: `${user_name} removed task "${deleted.title}"`,
        link: `/project/${task.project_id}/task`,
      });
    }

    // 📌 Activity
    await db.insert(Activity).values({
      user_id,
      project_id: task.project_id,
      type: 'TASK_DELETED',
      entity_type: 'task',
      entity_id: task.id,
      metadata: {
        title: deleted.title,
        status: deleted.status,
        assignee_id: deleted.assignee_id,
      },
    });

    return deleted;
  }
}
