ALTER TABLE "public"."lessons" ALTER COLUMN "content_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."lessons" ALTER COLUMN "content_type" SET DATA TYPE text;--> statement-breakpoint
UPDATE "public"."lessons" SET "content_type" = 'lesson' WHERE "content_type" IN ('sub_module', 'mentor_meeting', 'mentor_approval', 'facilitator_approval');--> statement-breakpoint
DROP TYPE "public"."content_type";--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('lesson', 'quiz', 'assignment', 'text_form', 'goal');--> statement-breakpoint
ALTER TABLE "public"."lessons" ALTER COLUMN "content_type" SET DATA TYPE "public"."content_type" USING "content_type"::"public"."content_type";--> statement-breakpoint
ALTER TABLE "public"."lessons" ALTER COLUMN "content_type" SET DEFAULT 'lesson';