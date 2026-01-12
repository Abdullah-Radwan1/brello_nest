ALTER TYPE "public"."notification_enums" RENAME TO "notification_type";--> statement-breakpoint
ALTER TABLE "Notification" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."notification_type";--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('TASK_ASSIGNED', 'TASK_STATUS_UPDATED', 'TASK_SUBMITTED', 'TASK_REVIEWED', 'TASK_REMOVED', 'INVITATION');--> statement-breakpoint
ALTER TABLE "Notification" ALTER COLUMN "type" SET DATA TYPE "public"."notification_type" USING "type"::"public"."notification_type";