import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';

// ===== ENUMS =====
export const Task_enums = pgEnum('task_enums', [
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
]);
export const TaskReviewStatusEnum = pgEnum('task_review_status', [
  'APPROVED',
  'REJECTED',
]);
export const Invitation_enums = pgEnum('Invitation_enums', [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
]);

export const Notification_enums = pgEnum('notification_enums', [
  'INVITATION',
  'TASK_ASSIGNED',
]);

export const Role_enums = pgEnum('role_enum', ['contributor', 'manager']);

export const TaskPriorityEnum = pgEnum('task_priority', [
  'LOW',
  'NORMAL',
  'URGENT',
]);
export const ColorEnum = pgEnum('color_enums', [
  'RED',
  'BLUE',
  'PURPLE',
  'BLUE',
  'PINK',
  'GREEN',
  'ROYALBLUE',
]);
export type UserColorType = (typeof ColorEnum.enumValues)[number];
// Create the enum in Drizzle
export const ProjectIconEnum = pgEnum('project_icon_enum', [
  'folder',
  'briefcase',
  'rocket',
  'target',
  'database',
  'users',
  'globe',
  'settings',
]);
export type ProjectIconType = (typeof ProjectIconEnum.enumValues)[number];

// ===== USERS =====
export const User = pgTable('User', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  allow_invitations: boolean().default(true),
  color: ColorEnum('color').notNull().default('PURPLE'), // uses color_enum now
});

// ===== PROJECTS =====
export const Project = pgTable('Project', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  manager_id: uuid('manager_id')
    .notNull()
    .references(() => User.id),
  createdAt: timestamp('created_at').defaultNow(),
  icon: ProjectIconEnum('icon').notNull().default('folder'), // default icon
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== CONTRIBUTORS =====
export const Contributor = pgTable('Contributor', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id')
    .notNull()
    .references(() => Project.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id')
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  role: Role_enums('role').notNull().default('contributor'),
});

// ===== TASKS =====
export const Task = pgTable('Task', {
  id: uuid('id').primaryKey().defaultRandom(),

  title: varchar('title', { length: 255 }).notNull(),

  description: text('description'),

  status: Task_enums('status').notNull().default('TODO'),

  priority: TaskPriorityEnum('priority').notNull().default('NORMAL'),

  start_date: timestamp('start_date', { mode: 'string' }),
  end_date: timestamp('end_date', { mode: 'string' }),

  project_id: uuid('project_id')
    .notNull()
    .references(() => Project.id, { onDelete: 'cascade' }),

  assignee_id: uuid('assignee_id').references(() => User.id, {
    onDelete: 'set null',
  }),

  createdAt: timestamp('created_at').defaultNow(),
});

export const TaskSubmission = pgTable('TaskSubmission', {
  task_id: uuid('task_id')
    .primaryKey()
    .references(() => Task.id, { onDelete: 'cascade' }),

  submitted_by: uuid('submitted_by')
    .notNull()
    .references(() => User.id),

  note: text('note').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
});

export const TaskReview = pgTable('TaskReview', {
  task_id: uuid('task_id')
    .primaryKey() // ⬅️ enforces ONE review per task
    .references(() => Task.id, { onDelete: 'cascade' }),

  reviewer_id: uuid('reviewer_id')
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),

  comment: text('comment').notNull(),
  status: TaskReviewStatusEnum('status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ===== INVITATIONS =====
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
  status: Invitation_enums('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ===== NOTIFICATIONS =====
export const Notification = pgTable('Notification', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  type: Notification_enums('type').notNull(),
  message: text('message').notNull(),
  link: varchar('link', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
