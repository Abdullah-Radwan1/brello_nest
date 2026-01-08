CREATE TABLE "TaskReview" (
	"task_id" uuid PRIMARY KEY NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "TaskReview" ADD CONSTRAINT "TaskReview_task_id_Task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."Task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TaskReview" ADD CONSTRAINT "TaskReview_reviewer_id_User_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;