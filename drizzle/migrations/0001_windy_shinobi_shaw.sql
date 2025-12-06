CREATE TYPE "public"."role_enum" AS ENUM('contributor', 'manager');--> statement-breakpoint
ALTER TABLE "Contributor" ALTER COLUMN "role" SET DEFAULT 'contributor'::"public"."role_enum";--> statement-breakpoint
ALTER TABLE "Contributor" ALTER COLUMN "role" SET DATA TYPE "public"."role_enum" USING "role"::"public"."role_enum";--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_admin_id_User_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;