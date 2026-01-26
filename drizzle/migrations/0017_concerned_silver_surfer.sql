ALTER TABLE "Activity" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."activity_type";--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('PROJECT_CREATED', 'PROJECT_UPDATED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_STATUS_CHANGED', 'TASK_ASSIGNED', 'TASK_DELETED', 'INVITATION_SENT', 'INVITATION_ACCEPTED', 'INVITATION_DECLINED', 'INVITATION_CANCELLED', 'COMMENT_ADDED');--> statement-breakpoint
ALTER TABLE "Activity" ALTER COLUMN "type" SET DATA TYPE "public"."activity_type" USING "type"::"public"."activity_type";--> statement-breakpoint
ALTER TABLE "Notification" ALTER COLUMN "link" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Notification" ALTER COLUMN "link" DROP NOT NULL;