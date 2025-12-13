// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { db } from 'src/db/drizzle';
import { Contributor, Invitation, Project, Task, User } from 'src/db/schema'; // ده الجدول اللي عملناه في drizzle.ts/schema
import bcrypt from 'bcrypt';
import { and, asc, count, eq, like, sql } from 'drizzle-orm';
@Injectable()
export class UsersService {
  async getAllUsers(
    page: number,
    limit: number,
    search: string,
    currentuser_id: string,
  ) {
    const offset = (page - 1) * limit;

    // Build where condition
    let whereCondition: any = sql`${User.id} != ${currentuser_id}`; // exclude current user

    if (search?.trim()) {
      whereCondition = and(
        whereCondition,
        like(User.name, `%${search.trim()}%`),
      );
    }

    // Fetch users with total count in a single query
    const usersWithCount = await db
      .select({
        id: User.id,
        name: User.name,
        total: sql<number>`count(*) OVER()`, // window function for total count
      })
      .from(User)
      .where(whereCondition)
      .orderBy(asc(User.id))
      .limit(limit)
      .offset(offset);

    // Extract total count from the first row (if exists)
    const total = usersWithCount.length > 0 ? usersWithCount[0].total : 0;

    // Remove the total from individual rows if you don't want it repeated
    const users = usersWithCount.map(({ total, ...rest }) => rest);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // البحث بالـ id بدل email
  async findOneBy(id: string) {
    const users = await db.select().from(User).where(eq(User.id, id));
    return users[0]; // object مباشر
  }

  async create(data: { name: string; email: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10); // salt rounds = 10

    const user = await db
      .insert(User)
      .values({ name: data.name, email: data.email, password: hashedPassword })
      .returning();
    return user;
  }
  // users.service.ts
  async findOneByEmail(email: string) {
    const users = await db.select().from(User).where(eq(User.email, email));
    return users[0]; // دلوقتي object مباشر
  }

  async overview(userId: string) {
    const [projectCount, contributorsCount, taskCount, pendingInvitations] =
      await Promise.all([
        // Count projects managed by the user
        db
          .select({ total: count() })
          .from(Project)
          .where(eq(Project.manager_id, userId))
          .then((res) => res[0]?.total || 0),

        // Count contributors in projects managed by the user
        db
          .select({ total: count() })
          .from(Contributor)
          .innerJoin(Project, eq(Project.id, Contributor.project_id))
          .where(eq(Project.manager_id, userId))
          .then((res) => res[0]?.total || 0),

        // Count tasks assigned to the user
        db
          .select({ total: count() })
          .from(Task)
          .where(eq(Task.assignee_id, userId))
          .then((res) => res[0]?.total || 0),

        // Count pending invitations for the user
        db
          .select({ total: count() })
          .from(Invitation)
          .where(
            and(
              eq(Invitation.invited_user_id, userId),
              eq(Invitation.status, 'PENDING'),
            ),
          )
          .then((res) => res[0]?.total || 0),
      ]);

    return {
      projects: projectCount,
      contributors: contributorsCount,
      tasks: taskCount,
      pendingInvitations,
    };
  }
}
