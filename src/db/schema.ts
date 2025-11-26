import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core';

// ===== TaskStatus enum =====
export const TaskStatus = pgEnum('task_status', [
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
]);

// ===== Users table =====
export const User = pgTable('User', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
});

// ===== Projects table =====
export const Project = pgTable('Project', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  adminId: uuid('admin_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ===== Contributors table =====
export const Contributor = pgTable('Contributor', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: varchar('role', { length: 50 }).notNull(), // contributor or manager
});

// ===== Tasks table =====
export const Task = pgTable('Task', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: TaskStatus('status').notNull().default('TODO'),
  projectId: uuid('project_id').notNull(),
  assigneeId: uuid('assignee_id'),
  createdAt: timestamp('created_at').defaultNow(),
});
