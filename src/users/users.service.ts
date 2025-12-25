// src/users/users.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from 'src/db/drizzle';
import { Contributor, Invitation, Project, Task, User } from 'src/db/schema'; // ده الجدول اللي عملناه في drizzle.ts/schema
import bcrypt from 'bcrypt';
import { and, asc, count, eq, ilike, like, ne, sql } from 'drizzle-orm';
import { UpdateUserDto } from './dto/update-user.dto';
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
        ilike(User.name, `%${search.trim()}%`),
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

  async updateUser(id: string, dto: UpdateUserDto) {
    console.log('updateUser called with id:', id, 'dto:', dto);
    const userRecord = await db.select().from(User).where(eq(User.id, id));
    const existingUser = userRecord[0];
    if (!existingUser) throw new NotFoundException('User not found');

    const updateData: Partial<typeof User.$inferInsert> = {};

    // ===============================
    // NORMAL FIELDS
    // ===============================
    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.email !== undefined) {
      updateData.email = dto.email;
    }

    if (dto.allow_invitations !== undefined) {
      updateData.allow_invitations = dto.allow_invitations;
    }

    console.log('updateData before password:', updateData);

    // ===============================
    // PASSWORD UPDATE
    // ===============================
    const wantsPasswordChange =
      dto.current_password || dto.new_password || dto.confirm_new_password;

    if (wantsPasswordChange) {
      if (!dto.current_password) {
        throw new BadRequestException('Current password is required');
      }

      const isMatch = await bcrypt.compare(
        dto.current_password,
        existingUser.password,
      );

      if (!isMatch) {
        throw new BadRequestException('Current password is incorrect');
      }

      if (!dto.new_password || !dto.confirm_new_password) {
        throw new BadRequestException(
          'New password and confirmation are required',
        );
      }

      if (dto.new_password !== dto.confirm_new_password) {
        throw new BadRequestException('Passwords do not match');
      }

      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(dto.new_password, salt);
    }

    console.log('updateData after password:', updateData);

    // 🚨 IMPORTANT: nothing to update
    if (Object.keys(updateData).length === 0) {
      console.log('Nothing to update');
      return existingUser;
    }

    console.log('Updating user with:', updateData);
    const [updatedUser] = await db
      .update(User)
      .set(updateData)
      .where(eq(User.id, id))
      .returning();

    console.log('Updated user:', updatedUser);
    return updatedUser;
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
          .where(
            and(
              eq(Project.manager_id, userId),
              ne(Contributor.user_id, userId), // Exclude the manager
            ),
          ) // todo , remove the manager count
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
