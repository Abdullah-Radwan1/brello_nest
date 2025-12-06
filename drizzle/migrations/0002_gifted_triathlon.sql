ALTER TABLE "Project" RENAME COLUMN "admin_id" TO "manager_id";--> statement-breakpoint
ALTER TABLE "Project" DROP CONSTRAINT "Project_admin_id_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_manager_id_User_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;