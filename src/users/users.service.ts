// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { db } from 'src/db/drizzle';
import { Contributor, User } from 'src/db/schema'; // ده الجدول اللي عملناه في drizzle.ts/schema
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
@Injectable()
export class UsersService {
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
