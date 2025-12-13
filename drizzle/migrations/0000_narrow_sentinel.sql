CREATE TYPE "public"."Invitation_enums" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."notification_enums" AS ENUM('INVITATION', 'TASK_ASSIGNED');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('contributor', 'manager');--> statement-breakpoint
CREATE TYPE "public"."task_enums" AS ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');--> statement-breakpoint
CREATE TABLE "Contributor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role_enum" DEFAULT 'contributor' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"invited_user_id" uuid NOT NULL,
	"inviter_id" uuid NOT NULL,
	"status" "Invitation_enums" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_enums" NOT NULL,
	"message" text NOT NULL,
	"link" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"manager_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "task_enums" DEFAULT 'TODO' NOT NULL,
	"project_id" uuid NOT NULL,
	"assignee_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "Contributor" ADD CONSTRAINT "Contributor_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Contributor" ADD CONSTRAINT "Contributor_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invited_user_id_User_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_inviter_id_User_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_manager_id_User_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Task" ADD CONSTRAINT "Task_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignee_id_User_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;