import { BadRequestException, Injectable } from '@nestjs/common';
import { db } from 'src/db/drizzle';
import {
  Contributor,
  Invitation,
  Notification,
  Project,
  Task,
  User,
} from 'src/db/schema';
import { and, eq, or, sql } from 'drizzle-orm';
import {
  CreateProjectInput,
  InvitationStatusTS,
  NotificationTypeTS,
  RoleEnumTS,
} from 'src/db/types';
import { assertionService } from 'src/assertion/assertion.service';

@Injectable()
export class ProjectService {
  constructor(private readonly projectAuth: assertionService) {}
  async createProject(
    data: CreateProjectInput,
    currentuser_id: string,
    currentUsername: string,
  ) {
    // 0️⃣ Check project limit
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(Project)
      .where(eq(Project.manager_id, currentuser_id));

    if (count >= 8) {
      throw new BadRequestException('You can only create up to 8 projects.');
    }

    // 1️⃣ Create project
    const [createdProject] = await db
      .insert(Project)
      .values({
        name: data.name,
        description: data.description,
        manager_id: currentuser_id,
      })
      .returning();

    // 2️⃣ Add creator as manager
    await db.insert(Contributor).values({
      project_id: createdProject.id,
      user_id: currentuser_id,
      role: RoleEnumTS.MANAGER,
    });

    // 3️⃣ Add invitations & notifications
    if (data.invitations?.length) {
      // Insert invitations
      await db.insert(Invitation).values(
        data.invitations.map((c) => ({
          project_id: createdProject.id,
          status: InvitationStatusTS.PENDING,
          invited_user_id: c.invited_user_id,
          inviter_id: currentuser_id,
        })),
      );

      // Insert notifications for each invited user
      await db.insert(Notification).values(
        data.invitations.map((c) => ({
          user_id: c.invited_user_id,
          message: `${currentUsername} has invited you to project "${createdProject.name}"`,
          link: `${process.env.FRONTEND_URL}/projects/${createdProject.id}`,
          type: NotificationTypeTS.INVITATION, // <-- cast here
        })),
      );
    }

    return createdProject;
  }

  findAllMyProjects(user_id: string) {
    return (
      db
        .select({
          id: Project.id,
          name: Project.name,
          description: Project.description,
          createdAt: Project.createdAt,
          managerName: User.name,
          icon: Project.icon,
          role: sql<'manager' | 'contributor'>`
        CASE
          WHEN ${Project.manager_id} = ${user_id} THEN 'manager'
          ELSE ${Contributor.role}
        END
      `.as('role'),

          contributorsCount: sql<number>`
        COUNT(DISTINCT ${Contributor.id})
      `.as('contributorsCount'),

          tasksCount: sql<number>`
        COUNT(DISTINCT ${Task.id})
      `.as('tasksCount'),
        })
        .from(Project)

        // manager info
        .leftJoin(User, eq(Project.manager_id, User.id))

        // contributors (including current user)
        .leftJoin(Contributor, eq(Contributor.project_id, Project.id))

        .leftJoin(Task, eq(Task.project_id, Project.id))

        // 👇 مهم جدًا
        .where(
          or(eq(Project.manager_id, user_id), eq(Contributor.user_id, user_id)),
        )

        .groupBy(Project.id, User.name, Contributor.role)
    );
  }
  async findOne(Project_id: string, user_id: string) {
    return db
      .select({
        id: Project.id,
        name: Project.name,
        description: Project.description,
        createdAt: Project.createdAt,
        managerName: User.name,

        // 🔢 count contributors per project
        contributorsCount: sql<number>`
        COUNT(DISTINCT ${Contributor.id})
      `.as('contributorsCount'),

        // 🔢 count tasks per project
        tasksCount: sql<number>`
        COUNT(DISTINCT ${Task.id})
      `.as('tasksCount'),
      })
      .from(Project)
      .leftJoin(Contributor, eq(Contributor.project_id, Project.id))
      .leftJoin(Task, eq(Task.project_id, Project.id))
      .leftJoin(User, eq(User.id, Project.manager_id))
      .where(
        and(
          eq(Project.id, Project_id),
          or(eq(Project.manager_id, user_id), eq(Contributor.user_id, user_id)),
        ),
      )
      .groupBy(Project.id, User.id)
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  async update(user_id: string, proejct_id: string, updateProjectDto: any) {
    await this.projectAuth.assertManager(proejct_id, user_id);
    return db
      .update(Project)
      .set(updateProjectDto)
      .where(eq(Project.id, proejct_id));
  }

  async remove(user_id: string, proejct_id: string) {
    await this.projectAuth.assertManager(user_id, proejct_id);
    return db.delete(Project).where(eq(Project.id, proejct_id));
  }
}
