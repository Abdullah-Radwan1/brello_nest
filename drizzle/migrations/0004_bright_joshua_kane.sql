ALTER TABLE "User" ADD COLUMN "allow_invitations" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "color" "color_enums" DEFAULT 'PURPLE';