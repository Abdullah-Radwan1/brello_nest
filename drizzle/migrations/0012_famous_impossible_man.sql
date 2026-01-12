CREATE TYPE "public"."activity_type" AS ENUM('PROJECT_CREATED', 'PROJECT_UPDATED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_STATUS_CHANGED', 'TASK_ASSIGNED', 'COMMENT_ADDED', 'INVITATION_SENT', 'INVITATION_ACCEPTED');--> statement-breakpoint
CREATE TABLE "Activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"type" "activity_type" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "password" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_user_project_time_idx" ON "Activity" USING btree ("user_id","project_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_project_time_idx" ON "Activity" USING btree ("project_id","created_at");--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_name_unique" UNIQUE("name");