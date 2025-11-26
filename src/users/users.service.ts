// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { db } from 'src/db/drizzle';
import { User } from 'src/db/schema'; // ده الجدول اللي عملناه في drizzle.ts/schema

@Injectable()
export class UsersService {
  async getAllUsers() {
    return await db.select().from(User);
  }
  async findOne(id: string) {}
  async create(data: { name: string; email: string; password: string }) {}
}
