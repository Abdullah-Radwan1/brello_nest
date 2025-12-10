import { BadRequestException, Injectable } from '@nestjs/common';

import { UpdateProjectDto } from './dto/update-project.dto';
import { db } from 'src/db/drizzle';
import { Contributor, Project } from 'src/db/schema';
import { eq, sql } from 'drizzle-orm';
import { CreateProjectInput, RoleEnumTS } from 'src/db/types';

@Injectable()
export class ProjectService {
  async createProject(data: CreateProjectInput, currentUserId: string) {
    // 0️⃣ Check project limit
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(Project)
      .where(eq(Project.manager_id, currentUserId));

    if (count >= 8) {
      throw new BadRequestException('You can only create up to 8 projects.');
    }

    // 1️⃣ Create project
    const [createdProject] = await db
      .insert(Project)
      .values({
        name: data.name,
        description: data.description,
        manager_id: currentUserId,
      })
      .returning();

    // 2️⃣ Add creator as manager
    await db.insert(Contributor).values({
      project_id: createdProject.id,
      userId: currentUserId,
      role: RoleEnumTS.MANAGER,
    });

    // 3️⃣ Add contributors
    if (data.contributors?.length) {
      await db.insert(Contributor).values(
        data.contributors.map((c) => ({
          project_id: createdProject.id,
          userId: c.userId,
          role: RoleEnumTS.CONTRIBUTOR,
        })),
      );
    }

    return createdProject;
  }

  findMyProjects(userId: string) {
    return db.select().from(Project).where(eq(Project.manager_id, userId));
  }

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  remove(id: string) {
    return db.delete(Project).where(eq(Project.id, id));
  }
}
