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

export const InvitationStatus = pgEnum('invitation_status', [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
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

export const Invitation = pgTable('Invitation', {
  id: uuid('id').primaryKey().defaultRandom(),

  project_id: uuid('project_id')
    .notNull()
    .references(() => Project.id, { onDelete: 'cascade' }),

  invited_user_id: uuid('invited_user_id')
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),

  inviter_id: uuid('inviter_id')
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),

  status: InvitationStatus('status').notNull().default('PENDING'),

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
