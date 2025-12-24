CREATE TYPE "public"."task_priority" AS ENUM('LOW', 'NORMAL', 'URGENT');--> statement-breakpoint
ALTER TABLE "Task" ADD COLUMN "priority" "task_priority" DEFAULT 'NORMAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "Task" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "Task" ADD COLUMN "end_date" timestamp;