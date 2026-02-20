CREATE TYPE "public"."quiz_grading_status" AS ENUM('auto_graded', 'pending_grade', 'graded');--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score" numeric(5, 2),
	"points_earned" integer DEFAULT 0 NOT NULL,
	"passed" boolean,
	"breakdown" jsonb DEFAULT '[]'::jsonb,
	"grading_status" "quiz_grading_status" DEFAULT 'auto_graded' NOT NULL,
	"graded_by" uuid,
	"graded_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_attempts_unique_idx" ON "quiz_attempts" USING btree ("lesson_id","enrollment_id","attempt_number");--> statement-breakpoint
CREATE INDEX "quiz_attempts_enrollment_idx" ON "quiz_attempts" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_lesson_idx" ON "quiz_attempts" USING btree ("lesson_id");