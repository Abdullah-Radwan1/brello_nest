CREATE TYPE "public"."task_review_status" AS ENUM('APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "TaskSubmission" (
	"task_id" uuid PRIMARY KEY NOT NULL,
	"submitted_by" uuid NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "TaskReview" ADD COLUMN "status" "task_review_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_task_id_Task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."Task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_submitted_by_User_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;