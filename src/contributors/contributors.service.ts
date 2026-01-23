import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateContributorDto } from './dto/create-contributor.dto';
import { UpdateContributorDto } from './dto/update-contributor.dto';
import { db } from '@/db/drizzle';
import { Activity, Contributor, Project, Task, User } from 'src/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { RemoveContributorsDto } from './dto/delete-contributor.dto';

@Injectable()
export class ContributorsService {
  create(createContributorDto: CreateContributorDto) {
    return 'This action adds a new contributor';
  }

  async getContributors(project_id: string) {
    return await db
      .select({
        user_id: User.id,
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

  async removeMany(user_id: string, dto: RemoveContributorsDto) {
    const { contributor_ids, project_id } = dto;

    return db.transaction(async (tx) => {
      // 1️⃣ Check project + manager
      const [project] = await tx
        .select({ manager_id: Project.manager_id })
        .from(Project)
        .where(eq(Project.id, project_id));

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      if (project.manager_id !== user_id) {
        throw new ForbiddenException(
          'Only the project manager can delete contributors.',
        );
      }

      // 2️⃣ Get all tasks assigned to those contributors
      const tasks = await tx
        .select({ id: Task.id })
        .from(Task)
        .where(
          and(
            eq(Task.project_id, project_id),
            inArray(Task.assignee_id, contributor_ids),
          ),
        );

      const taskIds = tasks.map((t) => t.id);

      // 3️⃣ Delete activities related to those tasks
      if (taskIds.length > 0) {
        await tx
          .delete(Activity)
          .where(
            and(
              eq(Activity.project_id, project_id),
              eq(Activity.entity_type, 'task'),
              inArray(Activity.entity_id, taskIds),
            ),
          );
      }

      // 4️⃣ Delete tasks (reviews + submissions cascade)
      if (taskIds.length > 0) {
        await tx.delete(Task).where(inArray(Task.id, taskIds));
      }

      // 5️⃣ Delete contributors
      return tx
        .delete(Contributor)
        .where(
          and(
            eq(Contributor.project_id, project_id),
            inArray(Contributor.user_id, contributor_ids),
          ),
        )
        .returning();
    });
  }
}
