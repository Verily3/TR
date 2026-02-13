CREATE TYPE "public"."task_progress_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."task_response_type" AS ENUM('text', 'file_upload', 'goal', 'completion_click', 'discussion');--> statement-breakpoint
CREATE TYPE "public"."module_type" AS ENUM('module', 'event');--> statement-breakpoint
CREATE TABLE "lesson_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"response_type" "task_response_type" DEFAULT 'completion_click' NOT NULL,
	"approval_required" "approval_required" DEFAULT 'none' NOT NULL,
	"due_date" timestamp with time zone,
	"due_days_offset" integer,
	"points" integer DEFAULT 0 NOT NULL,
	"config" jsonb,
	"status" "lesson_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"status" "task_progress_status" DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"submission_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "type" "module_type" DEFAULT 'module' NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "event_config" jsonb;--> statement-breakpoint
ALTER TABLE "approval_submissions" ADD COLUMN "task_id" uuid;--> statement-breakpoint
ALTER TABLE "lesson_tasks" ADD CONSTRAINT "lesson_tasks_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_progress" ADD CONSTRAINT "task_progress_task_id_lesson_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."lesson_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_progress" ADD CONSTRAINT "task_progress_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_tasks_lesson_id_idx" ON "lesson_tasks" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_tasks_order_idx" ON "lesson_tasks" USING btree ("lesson_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "task_progress_unique" ON "task_progress" USING btree ("task_id","enrollment_id");--> statement-breakpoint
CREATE INDEX "task_progress_task_id_idx" ON "task_progress" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_progress_enrollment_id_idx" ON "task_progress" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "task_progress_status_idx" ON "task_progress" USING btree ("status");--> statement-breakpoint
ALTER TABLE "approval_submissions" ADD CONSTRAINT "approval_submissions_task_id_lesson_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."lesson_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "programs_start_date_idx" ON "programs" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "programs_end_date_idx" ON "programs" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "modules_type_idx" ON "modules" USING btree ("type");--> statement-breakpoint
CREATE INDEX "lessons_approval_required_idx" ON "lessons" USING btree ("approval_required");--> statement-breakpoint
CREATE INDEX "enrollments_completed_at_idx" ON "enrollments" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "approval_submissions_task_idx" ON "approval_submissions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "individual_goals_target_date_idx" ON "individual_goals" USING btree ("target_date");