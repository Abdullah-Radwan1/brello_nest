import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateContributorDto } from './dto/create-contributor.dto';
import { UpdateContributorDto } from './dto/update-contributor.dto';
import { db } from 'src/db/drizzle';
import { Contributor, Project } from 'src/db/schema';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class ContributorsService {
  create(createContributorDto: CreateContributorDto) {
    return 'This action adds a new contributor';
  }

  async getContributors(project_id: string) {
    return await db
      .select()
      .from(Contributor)
      .where(eq(Contributor.project_id, project_id));
  }

  findOne(id: string) {
    return `This action returns a #${id} contributor`;
  }

  update(id: string, updateContributorDto: UpdateContributorDto) {
    return `This action updates a #${id} contributor`;
  }

  async removeMany(
    contributorIds: string[],
    manager_id: string,
    project_id: string,
  ) {
    // 1. get only manager_id instead of full project
    const [project] = await db
      .select({
        manager_id: Project.manager_id,
      })
      .from(Project)
      .where(eq(Project.id, project_id));

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. check manager
    if (project.manager_id !== manager_id) {
      throw new ForbiddenException(
        'Only the project manager can delete contributors.',
      );
    }

    // 3. delete contributors
    return db
      .delete(Contributor)
      .where(inArray(Contributor.id, contributorIds))
      .returning();
  }
}
