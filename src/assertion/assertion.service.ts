// src/authorization/project-authorization.service.ts
import { ForbiddenException, Injectable } from '@nestjs/common';
import { db } from 'src/db/drizzle';
import { Project, User } from 'src/db/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class assertionService {
  async assertManager(project_id: string, user_id: string) {
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
}
