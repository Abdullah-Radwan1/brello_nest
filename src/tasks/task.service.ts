import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { db } from 'src/db/drizzle';
import { Notification, Task } from 'src/db/schema';
import { eq } from 'drizzle-orm';

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

  async findAll(project_id: string) {
    return db.select().from(Task).where(eq(Task.project_id, project_id));
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

  async remove(id: string) {
    const [deleted] = await db.delete(Task).where(eq(Task.id, id)).returning();
    if (!deleted) throw new NotFoundException('Task not found');
    return deleted;
  }
}
