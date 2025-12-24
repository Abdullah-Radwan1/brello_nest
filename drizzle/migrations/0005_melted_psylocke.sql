CREATE TYPE "public"."color_enums" AS ENUM('RED', 'BLUE', 'PURPLE', 'BLUE', 'PINK', 'GREEN', 'ROYALBLUE');--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "color" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "color" SET DATA TYPE "public"."color_enums" USING "color"::text::"public"."color_enums";--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "color" SET DEFAULT 'PURPLE';--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "color" SET NOT NULL;