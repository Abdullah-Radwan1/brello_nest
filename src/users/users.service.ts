// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { db } from 'src/db/drizzle';
import { Contributor, User } from 'src/db/schema'; // ده الجدول اللي عملناه في drizzle.ts/schema
import bcrypt from 'bcrypt';
import { and, asc, eq, like, sql } from 'drizzle-orm';
@Injectable()
export class UsersService {
  async getAllUsers(
    page: number,
    limit: number,
    search: string,
    currentUserId: string,
  ) {
    const offset = (page - 1) * limit;

    // Build where condition
    let whereCondition: any = sql`${User.id} != ${currentUserId}`; // exclude current user

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

  async getContributors(project_id: string) {
    return await db
      .select()
      .from(Contributor)
      .where(eq(Contributor.project_id, project_id));
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
}
