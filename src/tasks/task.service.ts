import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { db } from 'src/db/drizzle';
import { Contributor, Notification, Task, User } from 'src/db/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class TaskService {
  async create(createTaskDto: CreateTaskDto) {
    const [task] = await db.insert(Task).values(createTaskDto).returning();
    if (task.assignee_id) {
      await db.insert(Notification).values({
        user_id: task.assignee_id,
        type: 'TASK_ASSIGNED',
        message: `You have been assigned to task "${task.title}"`,
        link: `/projects/${task.project_id}/tasks/${task.id}`, // example route
      });
    }
    return task;
  }

  async findAll(@Query('project_id') project_id: string) {
    if (!project_id) {
      throw new NotFoundException('no id found');
    }
    const tasks = await db
      .select({
        id: Task.id,
        title: Task.title,
        description: Task.description,
        status: Task.status,
        project_id: Task.project_id,
        assignee_id: Task.assignee_id,
        priority: Task.priority,
        start_date: Task.start_date,
        end_date: Task.end_date,
        assignee: {
          id: User.id,
          name: User.name,
          email: User.email,
        },
      })
      .from(Task)
      .leftJoin(User, eq(Task.assignee_id, User.id))
      .where(eq(Task.project_id, project_id));
    return tasks;
  }

  async findOne(id: string) {
    const [task] = await db.select().from(Task).where(eq(Task.id, id));
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const [updated] = await db
      .update(Task)
      .set(updateTaskDto)
      .where(eq(Task.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  async remove(taskId: string, userId: string) {
    const [task] = await db
      .select({
        id: Task.id,
        project_id: Task.project_id,
      })
      .from(Task)
      .where(eq(Task.id, taskId));

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const [isAdmin] = await db
      .select()
      .from(Contributor)
      .where(
        and(
          eq(Contributor.project_id, task.project_id),
          eq(Contributor.user_id, userId),
          eq(Contributor.role, 'manager'),
        ),
      );

    if (!isAdmin) {
      throw new ForbiddenException('Only project admins can delete tasks');
    }

    const [deleted] = await db
      .delete(Task)
      .where(eq(Task.id, taskId))
      .returning();

    return deleted;
  }
}
