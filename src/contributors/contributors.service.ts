import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateContributorDto } from './dto/create-contributor.dto';
import { UpdateContributorDto } from './dto/update-contributor.dto';
import { db } from 'src/db/drizzle';
import { Contributor, Project, User } from 'src/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { RemoveContributorsDto } from './dto/delete-contributor.dto';

@Injectable()
export class ContributorsService {
  create(createContributorDto: CreateContributorDto) {
    return 'This action adds a new contributor';
  }

  async getContributors(project_id: string) {
    return await db
      .select({
        id: User.id,
        name: User.name, // user’s name
        role: Contributor.role, // role in the project
        email: User.email,
      })
      .from(Contributor)
      .leftJoin(User, eq(User.id, Contributor.user_id))

      .where(eq(Contributor.project_id, project_id));
  }

  findOne(id: string) {
    return `This action returns a #${id} contributor`;
  }

  update(id: string, updateContributorDto: UpdateContributorDto) {
    return `This action updates a #${id} contributor`;
  }

  async removeMany(dto: RemoveContributorsDto, user_id: string) {
    const { contributor_ids, project_id } = dto;
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
    if (project.manager_id !== user_id) {
      throw new ForbiddenException(
        'Only the project manager can delete contributors.',
      );
    }

    // 3. delete contributors
    return db
      .delete(Contributor)
      .where(inArray(Contributor.user_id, contributor_ids))
      .returning();
  }
}
