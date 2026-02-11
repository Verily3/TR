CREATE TYPE "public"."program_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."program_type" AS ENUM('cohort', 'self_paced');--> statement-breakpoint
CREATE TYPE "public"."module_drip_type" AS ENUM('immediate', 'days_after_enrollment', 'days_after_previous', 'on_date');--> statement-breakpoint
CREATE TYPE "public"."module_status" AS ENUM('draft', 'active');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('lesson', 'sub_module', 'quiz', 'assignment', 'mentor_meeting', 'text_form', 'goal', 'mentor_approval', 'facilitator_approval');--> statement-breakpoint
CREATE TYPE "public"."lesson_drip_type" AS ENUM('immediate', 'sequential', 'days_after_module_start', 'on_date');--> statement-breakpoint
CREATE TYPE "public"."lesson_status" AS ENUM('draft', 'active');--> statement-breakpoint
CREATE TYPE "public"."enrollment_role" AS ENUM('learner', 'mentor', 'facilitator');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'completed', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."mentorship_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('draft', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."progress_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."review_frequency" AS ENUM('weekly', 'biweekly', 'monthly', 'quarterly');--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"agency_id" uuid,
	"name" varchar(255) NOT NULL,
	"internal_name" varchar(255),
	"description" text,
	"type" "program_type" DEFAULT 'cohort' NOT NULL,
	"status" "program_status" DEFAULT 'draft' NOT NULL,
	"cover_image" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"timezone" varchar(50) DEFAULT 'America/New_York',
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"parent_module_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"drip_type" "module_drip_type" DEFAULT 'immediate' NOT NULL,
	"drip_value" integer,
	"drip_date" timestamp with time zone,
	"status" "module_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content_type" "content_type" DEFAULT 'lesson' NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb,
	"order" integer DEFAULT 0 NOT NULL,
	"duration_minutes" integer,
	"points" integer DEFAULT 0 NOT NULL,
	"drip_type" "lesson_drip_type" DEFAULT 'immediate' NOT NULL,
	"drip_value" integer,
	"drip_date" timestamp with time zone,
	"visible_to" jsonb DEFAULT '{"learner":true,"mentor":true,"facilitator":true}'::jsonb,
	"status" "lesson_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollment_mentorships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"mentor_user_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "mentorship_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role" "enrollment_role" DEFAULT 'learner' NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"progress" integer DEFAULT 0 NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"submission_text" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goal_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"statement" text NOT NULL,
	"success_metrics" text,
	"action_steps" jsonb DEFAULT '[]'::jsonb,
	"target_date" date,
	"review_frequency" "review_frequency" DEFAULT 'monthly' NOT NULL,
	"status" "goal_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goal_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_response_id" uuid NOT NULL,
	"review_date" date NOT NULL,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"reflection_notes" text,
	"next_steps" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"status" "progress_status" DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"submission_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_mentorships" ADD CONSTRAINT "enrollment_mentorships_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_mentorships" ADD CONSTRAINT "enrollment_mentorships_mentor_user_id_users_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_mentorships" ADD CONSTRAINT "enrollment_mentorships_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_submissions" ADD CONSTRAINT "approval_submissions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_submissions" ADD CONSTRAINT "approval_submissions_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_submissions" ADD CONSTRAINT "approval_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_responses" ADD CONSTRAINT "goal_responses_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_responses" ADD CONSTRAINT "goal_responses_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_reviews" ADD CONSTRAINT "goal_reviews_goal_response_id_goal_responses_id_fk" FOREIGN KEY ("goal_response_id") REFERENCES "public"."goal_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "programs_tenant_id_idx" ON "programs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "programs_agency_id_idx" ON "programs" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "programs_status_idx" ON "programs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "programs_type_idx" ON "programs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "modules_program_id_idx" ON "modules" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "modules_parent_module_id_idx" ON "modules" USING btree ("parent_module_id");--> statement-breakpoint
CREATE INDEX "modules_order_idx" ON "modules" USING btree ("program_id","order");--> statement-breakpoint
CREATE INDEX "lessons_module_id_idx" ON "lessons" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "lessons_order_idx" ON "lessons" USING btree ("module_id","order");--> statement-breakpoint
CREATE INDEX "lessons_content_type_idx" ON "lessons" USING btree ("content_type");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_mentorships_unique" ON "enrollment_mentorships" USING btree ("enrollment_id","mentor_user_id");--> statement-breakpoint
CREATE INDEX "enrollment_mentorships_mentor_idx" ON "enrollment_mentorships" USING btree ("mentor_user_id");--> statement-breakpoint
CREATE INDEX "enrollment_mentorships_program_idx" ON "enrollment_mentorships" USING btree ("program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollments_program_user_unique" ON "enrollments" USING btree ("program_id","user_id");--> statement-breakpoint
CREATE INDEX "enrollments_program_id_idx" ON "enrollments" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "enrollments_user_id_idx" ON "enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "enrollments_tenant_id_idx" ON "enrollments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "enrollments_role_idx" ON "enrollments" USING btree ("role");--> statement-breakpoint
CREATE INDEX "enrollments_status_idx" ON "enrollments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "approval_submissions_unique" ON "approval_submissions" USING btree ("lesson_id","enrollment_id");--> statement-breakpoint
CREATE INDEX "approval_submissions_enrollment_idx" ON "approval_submissions" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "approval_submissions_lesson_idx" ON "approval_submissions" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "approval_submissions_status_idx" ON "approval_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "approval_submissions_reviewer_idx" ON "approval_submissions" USING btree ("reviewed_by");--> statement-breakpoint
CREATE UNIQUE INDEX "goal_responses_unique" ON "goal_responses" USING btree ("lesson_id","enrollment_id");--> statement-breakpoint
CREATE INDEX "goal_responses_enrollment_idx" ON "goal_responses" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "goal_responses_lesson_idx" ON "goal_responses" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "goal_responses_status_idx" ON "goal_responses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "goal_reviews_goal_response_idx" ON "goal_reviews" USING btree ("goal_response_id");--> statement-breakpoint
CREATE INDEX "goal_reviews_date_idx" ON "goal_reviews" USING btree ("review_date");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_progress_unique" ON "lesson_progress" USING btree ("enrollment_id","lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_progress_enrollment_idx" ON "lesson_progress" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "lesson_progress_lesson_idx" ON "lesson_progress" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_progress_status_idx" ON "lesson_progress" USING btree ("status");