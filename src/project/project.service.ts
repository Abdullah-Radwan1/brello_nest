import { BadRequestException, Injectable } from '@nestjs/common';
import { db } from '../db/drizzle';
import {
  Activity,
  Contributor,
  Invitation,
  Notification,
  Project,
  Task,
  User,
} from 'src/db/schema';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import {
  CreateProjectInput,
  InvitationStatusTS,
  NotificationTypeTS,
  RoleEnumTS,
} from 'src/db/types';
import { assertionService } from '../assertion/assertion.service';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly assertion: assertionService) {}
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

    // 3️⃣ Insert ACTIVITY (project creation)
    await db.insert(Activity).values({
      user_id: currentuser_id,
      project_id: createdProject.id,
      type: 'PROJECT_CREATED',

      entity_type: 'project',
      entity_id: createdProject.id,

      metadata: {
        projectName: createdProject.name,
        createdBy: currentUsername,
      },
    });

    // 4️⃣ Add invitations & notifications
    if (data.invitations?.length) {
      // Invitations
      await db.insert(Invitation).values(
        data.invitations.map((c) => ({
          project_id: createdProject.id,
          status: InvitationStatusTS.PENDING,
          invited_user_id: c.invited_user_id,
          inviter_id: currentuser_id,
        })),
      );

      // Notifications
      await db.insert(Notification).values(
        data.invitations.map((c) => ({
          user_id: c.invited_user_id,
          type: NotificationTypeTS.INVITATION,
          message: `${currentUsername} has invited you to project "${createdProject.name}"`,
          link: `/project/${createdProject.id}`,
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
          // Determine the role of the current user for this project
          // If the current user is the manager → 'manager', otherwise 'contributor'
          // This is a literal expression, so it does not require GROUP BY
          role: sql<'manager' | 'contributor'>`
          CASE
            WHEN ${Project.manager_id} = ${user_id} THEN 'manager'
            ELSE 'contributor'
          END
        `.as('role'),

          // Count the number of distinct contributors for this project
          contributorsCount: sql<number>`COUNT(DISTINCT ${Contributor.id})`.as(
            'contributorsCount',
          ),

          // Count the number of distinct tasks for this project
          tasksCount: sql<number>`COUNT(DISTINCT ${Task.id})`.as('tasksCount'),
        })
        .from(Project) // The main table we are selecting from

        // Join the User table to get manager information
        .leftJoin(User, eq(Project.manager_id, User.id))

        // Join the Contributor table to count contributors and filter by user
        .leftJoin(Contributor, eq(Contributor.project_id, Project.id))

        // Join the Task table to count tasks per project
        .leftJoin(Task, eq(Task.project_id, Project.id))

        // Filter projects where the current user is either the manager or a contributor
        .where(
          or(eq(Project.manager_id, user_id), eq(Contributor.user_id, user_id)),
        )

        //Every column in your SELECT that is not inside an aggregate must appear in GROUP BY.
        // Group results by Project ID and manager name
        // Needed because we use COUNT() aggregation
        .groupBy(Project.id, User.name)
    );
  }
  async findOne(user_id: string, Project_id: string) {
    return db
      .select({
        id: Project.id,
        name: Project.name,
        description: Project.description,
        createdAt: Project.createdAt,
        managerName: User.name,
        // 🎭 role of current user
        role: sql<'manager' | 'contributor'>`
        CASE
          WHEN ${Project.manager_id} = ${user_id} THEN 'manager'
          ELSE ${Contributor.role}
        END
      `.as('role'),
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
      .groupBy(Project.id, User.id, Contributor.role)
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  async lastProject(user_id: string) {
    const lastActivityWithProject = await db
      .select({
        projectId: Activity.project_id,
        projectName: Project.name,
        projectDescription: Project.description,
        projectIcon: Project.icon,
        projectCreatedAt: Project.createdAt,
        managerName: User.name,
        lastActivityType: Activity.type,
        lastActivityMetadata: Activity.metadata,
        lastActivityAt: Activity.createdAt,

        contributorsCount: sql<number>`(
        SELECT COUNT(*) FROM "Contributor"
        WHERE "Contributor"."project_id" = "Project"."id"
      )`.as('contributorsCount'),

        tasksCount: sql<number>`(
        SELECT COUNT(*) FROM "Task"
        WHERE "Task"."project_id" = "Project"."id"
      )`.as('tasksCount'),

        completedTasks: sql<number>`(
        SELECT COUNT(*) FROM "Task"
        WHERE "Task"."project_id" = "Project"."id"
        AND "Task"."status" = 'DONE'
      )`.as('completedTasks'),
      })
      .from(Activity)
      .leftJoin(Project, eq(Project.id, Activity.project_id))
      .leftJoin(User, eq(User.id, Project.manager_id))
      .where(eq(Activity.user_id, user_id))
      .orderBy(desc(Activity.createdAt))
      .limit(1);

    if (!lastActivityWithProject[0]) return null;

    return lastActivityWithProject[0];
  }

  async update(
    user_id: string,
    project_id: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    await this.assertion.assertManager(user_id, project_id);
    await db.insert(Activity).values({
      user_id,
      project_id,
      type: 'PROJECT_UPDATED',

      entity_type: 'project',
      entity_id: project_id,

      metadata: {
        updatedFields: Object.keys(updateProjectDto),
      },
    });
    return db
      .update(Project)
      .set(updateProjectDto)
      .where(eq(Project.id, project_id));
  }

  async removeProject(user_id: string, project_id: string) {
    await this.assertion.assertManager(user_id, project_id);
    return db.delete(Project).where(eq(Project.id, project_id));
  }

  async removeSelf(user_id: string, project_id: string) {
    return db
      .delete(Contributor)
      .where(
        and(
          eq(Contributor.user_id, user_id),
          eq(Contributor.project_id, project_id),
        ),
      );
  }
}
