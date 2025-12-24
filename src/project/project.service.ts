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
import { and, eq, sql } from 'drizzle-orm';
import {
  CreateProjectInput,
  InvitationStatusTS,
  NotificationTypeTS,
  RoleEnumTS,
} from 'src/db/types';

@Injectable()
export class ProjectService {
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

  findMyProjects(user_id: string) {
    return (
      db
        .select({
          id: Project.id,
          name: Project.name,
          description: Project.description,
          createdAt: Project.createdAt,
          managerName: User.name,
          // 🔢 Count unique contributors linked to each project
          // DISTINCT prevents duplicate counting caused by joins
          contributorsCount: sql<number>`
        COUNT(DISTINCT ${Contributor.id})
      `.as('contributorsCount'),

          // 🔢 Count unique tasks linked to each project
          // DISTINCT prevents over-counting when contributors exist
          tasksCount: sql<number>`
        COUNT(DISTINCT ${Task.id})
      `.as('tasksCount'),
        })

        // 📦 Main table: projects
        .from(Project)
        // 👇 REQUIRED
        .leftJoin(User, eq(Project.manager_id, User.id))
        // 🔗 LEFT JOIN contributors
        // Keeps projects even if they have NO contributors
        .leftJoin(Contributor, eq(Contributor.project_id, Project.id))

        // 🔗 LEFT JOIN tasks
        // Keeps projects even if they have NO tasks
        .leftJoin(Task, eq(Task.project_id, Project.id))

        // 🎯 Filter projects managed by the current user
        .where(eq(Project.manager_id, user_id))

        // 📊 GROUP BY project
        // Required because we use COUNT() aggregations
        .groupBy(Project.id, User.id)
    );
  }
  findProjects(user_id: string) {
    return (
      db
        .select({
          id: Project.id,
          name: Project.name,
          description: Project.description,
          createdAt: Project.createdAt,
          managerName: User.name, // Get manager's name instead of project name
          // 🔢 Count unique contributors linked to each project
          contributorsCount: sql<number>`
          COUNT(DISTINCT ${Contributor.id})
        `.as('contributorsCount'),

          // 🔢 Count unique tasks linked to each project
          tasksCount: sql<number>`
          COUNT(DISTINCT ${Task.id})
        `.as('tasksCount'),
        })

        // 📦 Main table: projects
        .from(Project)

        // 🔗 JOIN contributors to find projects user contributes to
        .innerJoin(Contributor, eq(Contributor.project_id, Project.id))

        // 🔗 JOIN users to get manager's name (assuming Project.manager_id exists)
        .leftJoin(User, eq(Project.manager_id, User.id))

        // 🔗 LEFT JOIN tasks for counting
        .leftJoin(Task, eq(Task.project_id, Project.id))

        // 🎯 Filter projects where user is a contributor
        .where(
          and(
            eq(Contributor.user_id, user_id),
            eq(Contributor.role, 'contributor'), // 👈 IMPORTANT
          ),
        )

        // 📊 GROUP BY project
        .groupBy(Project.id, User.name) // Add User.name to GROUP BY
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
      .where(and(eq(Project.id, Project_id), eq(Contributor.user_id, user_id)))
      .groupBy(Project.id, User.id)
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  update(id: number, updateProjectDto: any) {
    return `This action updates a #${id} project`;
  }

  remove(id: string) {
    return db.delete(Project).where(eq(Project.id, id));
  }
}
