// src/authorization/project-authorization.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../db/drizzle';
import { Contributor, Project, Task } from '../db/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class assertionService {
  async assertManager(user_id: string, project_id: string) {
    const project = await db
      .select({ id: Project.id })
      .from(Project)
      .where(and(eq(Project.id, project_id), eq(Project.manager_id, user_id)))
      .limit(1);

    if (project.length === 0) {
      throw new ForbiddenException(
        'Only project manager can perform this action',
      );
    }
  }
  async assertContributor(user_id: string, project_id: string) {
    const [contributor] = await db
      .select()
      .from(Contributor)
      .where(
        and(
          eq(Contributor.user_id, user_id),
          eq(Contributor.project_id, project_id),
        ),
      );

    if (!contributor) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return contributor; // includes role
  }

  async getUserRole(user_id: string, project_id: string) {
    const contributor = await this.assertContributor(user_id, project_id);

    return contributor.role; // 'manager' | 'contributor'
  }

  async assertTaskExists(task_id: string) {
    const [task] = await db
      .select({
        id: Task.id,
        project_id: Task.project_id,
        status: Task.status,
        assignee_id: Task.assignee_id,
        title: Task.title,
      })
      .from(Task)
      .where(eq(Task.id, task_id));

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }
}
