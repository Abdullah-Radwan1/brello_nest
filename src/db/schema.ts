import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ===== TaskStatus enum =====
export const TaskStatus = pgEnum('task_status', [
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
]);
export const RoleEnum = pgEnum('role_enum', ['contributor', 'manager']);

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
  manager_id: uuid('manager_id')
    .notNull()
    .references(() => User.id), // ✔ correct
  createdAt: timestamp('created_at').defaultNow(),
});

// ===== Contributors table =====
export const Contributor = pgTable('Contributor', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: RoleEnum('role').notNull().default('contributor'),
});

// ===== Tasks table =====
export const Task = pgTable('Task', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: TaskStatus('status').notNull().default('TODO'),
  project_id: uuid('project_id').notNull(),
  assignee_id: uuid('assignee_id'),
  createdAt: timestamp('created_at').defaultNow(),
});
