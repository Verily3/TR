CREATE TYPE "public"."reviewer_role" AS ENUM('mentor', 'facilitator');--> statement-breakpoint
DROP INDEX "approval_submissions_unique";--> statement-breakpoint
ALTER TABLE "approval_submissions" ADD COLUMN "reviewer_role" "reviewer_role" NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "approval_submissions_unique" ON "approval_submissions" USING btree ("lesson_id","enrollment_id","reviewer_role");