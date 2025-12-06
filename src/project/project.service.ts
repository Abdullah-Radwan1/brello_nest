import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { db } from 'src/db/drizzle';
import { Contributor, Project } from 'src/db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ProjectService {
  async createProject(data: {
    manager_id: string;
    name: string;
    description?: string;
  }) {
    // 1. Create project
    const project = await db
      .insert(Project)
      .values({
        name: data.name,
        description: data.description,
        manager_id: data.manager_id, // automatically set admin
      })
      .returning();

    const createdProject = project[0];

    // 2. Add the creator as a contributor (manager role)
    await db.insert(Contributor).values({
      project_id: createdProject.id,
      userId: data.manager_id,
      role: 'manager', // or "admin" if you prefer
    });

    return createdProject;
  }

  findAll() {
    return `This action returns all project`;
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
