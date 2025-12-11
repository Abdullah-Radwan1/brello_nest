CREATE TYPE "public"."invitation_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED');--> statement-breakpoint
CREATE TABLE "Invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"invited_user_id" uuid NOT NULL,
	"inviter_id" uuid NOT NULL,
	"status" "invitation_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invited_user_id_User_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_inviter_id_User_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;