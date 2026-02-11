CREATE TYPE "public"."onboarding_status" AS ENUM('not_started', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."onboarding_type" AS ENUM('program_only', 'strategic_planning', 'full_platform');--> statement-breakpoint
CREATE TYPE "public"."goal_category" AS ENUM('professional', 'personal', 'leadership', 'strategic', 'performance', 'development');--> statement-breakpoint
CREATE TYPE "public"."goal_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."individual_goal_status" AS ENUM('draft', 'active', 'completed', 'on_hold', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."goal_alignment_type" AS ENUM('supports', 'derived_from', 'related');--> statement-breakpoint
CREATE TYPE "public"."strategic_plan_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."strategic_plan_type" AS ENUM('3hag', 'bhag', 'annual', 'quarterly');--> statement-breakpoint
CREATE TYPE "public"."assessment_type" AS ENUM('180', '360', 'custom');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('rating', 'text', 'multiple_choice', 'ranking');--> statement-breakpoint
CREATE TYPE "public"."rater_type" AS ENUM('self', 'manager', 'peer', 'direct_report');--> statement-breakpoint
CREATE TYPE "public"."template_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."assessment_status" AS ENUM('draft', 'open', 'closed', 'completed');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'sent', 'viewed', 'started', 'completed', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."mentoring_relationship_status" AS ENUM('active', 'paused', 'ended');--> statement-breakpoint
CREATE TYPE "public"."mentoring_relationship_type" AS ENUM('mentor', 'coach', 'manager', 'peer');--> statement-breakpoint
CREATE TYPE "public"."action_item_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."action_item_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."mentoring_session_status" AS ENUM('scheduled', 'prep_in_progress', 'ready', 'in_progress', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."mentoring_session_type" AS ENUM('mentoring', 'one_on_one', 'check_in', 'review', 'planning');--> statement-breakpoint
CREATE TYPE "public"."note_visibility" AS ENUM('private', 'shared');--> statement-breakpoint
CREATE TABLE "onboarding_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid,
	"program_id" uuid,
	"onboarding_type" "onboarding_type" DEFAULT 'full_platform' NOT NULL,
	"current_step" varchar(50) NOT NULL,
	"completed_steps" jsonb DEFAULT '[]'::jsonb,
	"form_data" jsonb DEFAULT '{}'::jsonb,
	"status" "onboarding_status" DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "individual_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"success_metrics" text,
	"action_steps" jsonb DEFAULT '[]'::jsonb,
	"category" "goal_category" DEFAULT 'professional',
	"priority" "goal_priority" DEFAULT 'medium',
	"start_date" date,
	"target_date" date,
	"progress" integer DEFAULT 0 NOT NULL,
	"status" "individual_goal_status" DEFAULT 'draft' NOT NULL,
	"parent_goal_id" uuid,
	"review_frequency" text DEFAULT 'monthly',
	"last_reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategic_goal_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategic_plan_id" uuid NOT NULL,
	"individual_goal_id" uuid,
	"program_goal_id" uuid,
	"alignment_type" "goal_alignment_type" DEFAULT 'supports' NOT NULL,
	"alignment_notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategic_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_by" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"plan_type" "strategic_plan_type" NOT NULL,
	"start_date" date,
	"target_date" date,
	"status" "strategic_plan_status" DEFAULT 'draft' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"parent_plan_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"created_by" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"assessment_type" "assessment_type" DEFAULT '360' NOT NULL,
	"status" "template_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_template_id" uuid,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"rater_id" uuid NOT NULL,
	"rater_type" "rater_type" NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"access_token" varchar(64),
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"reminder_count" varchar(10) DEFAULT '0',
	"last_reminder_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_invitations_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "assessment_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"responses" jsonb NOT NULL,
	"overall_comments" text,
	"submitted_at" timestamp with time zone,
	"is_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"created_by" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "assessment_status" DEFAULT 'draft' NOT NULL,
	"open_date" date,
	"close_date" date,
	"anonymize_results" boolean DEFAULT true NOT NULL,
	"show_results_to_subject" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"mentor_id" uuid NOT NULL,
	"mentee_id" uuid NOT NULL,
	"relationship_type" "mentoring_relationship_type" DEFAULT 'mentor' NOT NULL,
	"status" "mentoring_relationship_status" DEFAULT 'active' NOT NULL,
	"meeting_preferences" jsonb DEFAULT '{}'::jsonb,
	"description" text,
	"goals" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_action_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"relationship_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"priority" "action_item_priority" DEFAULT 'medium' NOT NULL,
	"status" "action_item_status" DEFAULT 'pending' NOT NULL,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_session_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"visibility" "note_visibility" DEFAULT 'shared' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_session_prep" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"wins" text,
	"challenges" text,
	"topics_to_discuss" jsonb DEFAULT '[]'::jsonb,
	"questions_for_mentor" text,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid NOT NULL,
	"title" varchar(255),
	"session_type" "mentoring_session_type" DEFAULT 'mentoring' NOT NULL,
	"scheduled_date" date NOT NULL,
	"scheduled_time" varchar(10),
	"duration" integer DEFAULT 60 NOT NULL,
	"timezone" varchar(50) DEFAULT 'America/New_York',
	"location" varchar(255),
	"meeting_link" text,
	"status" "mentoring_session_status" DEFAULT 'scheduled' NOT NULL,
	"agenda" text,
	"summary" text,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "programs" DROP CONSTRAINT "programs_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "programs" DROP CONSTRAINT "programs_agency_id_agencies_id_fk";
--> statement-breakpoint
ALTER TABLE "programs" ALTER COLUMN "tenant_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "programs" ALTER COLUMN "agency_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "allowed_tenant_ids" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "individual_goals" ADD CONSTRAINT "individual_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "individual_goals" ADD CONSTRAINT "individual_goals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_goal_links" ADD CONSTRAINT "strategic_goal_links_strategic_plan_id_strategic_plans_id_fk" FOREIGN KEY ("strategic_plan_id") REFERENCES "public"."strategic_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_goal_links" ADD CONSTRAINT "strategic_goal_links_individual_goal_id_individual_goals_id_fk" FOREIGN KEY ("individual_goal_id") REFERENCES "public"."individual_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_goal_links" ADD CONSTRAINT "strategic_goal_links_program_goal_id_goal_responses_id_fk" FOREIGN KEY ("program_goal_id") REFERENCES "public"."goal_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_goal_links" ADD CONSTRAINT "strategic_goal_links_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_plans" ADD CONSTRAINT "strategic_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_plans" ADD CONSTRAINT "strategic_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_rater_id_users_id_fk" FOREIGN KEY ("rater_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_invitation_id_assessment_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."assessment_invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_template_id_assessment_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."assessment_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subject_id_users_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_relationships" ADD CONSTRAINT "mentoring_relationships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_relationships" ADD CONSTRAINT "mentoring_relationships_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_relationships" ADD CONSTRAINT "mentoring_relationships_mentee_id_users_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_action_items" ADD CONSTRAINT "mentoring_action_items_session_id_mentoring_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mentoring_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_action_items" ADD CONSTRAINT "mentoring_action_items_relationship_id_mentoring_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."mentoring_relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_action_items" ADD CONSTRAINT "mentoring_action_items_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_session_notes" ADD CONSTRAINT "mentoring_session_notes_session_id_mentoring_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mentoring_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_session_notes" ADD CONSTRAINT "mentoring_session_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_session_prep" ADD CONSTRAINT "mentoring_session_prep_session_id_mentoring_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mentoring_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_session_prep" ADD CONSTRAINT "mentoring_session_prep_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_sessions" ADD CONSTRAINT "mentoring_sessions_relationship_id_mentoring_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."mentoring_relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_progress_user_program_unique" ON "onboarding_progress" USING btree ("user_id","program_id");--> statement-breakpoint
CREATE INDEX "onboarding_progress_user_idx" ON "onboarding_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "onboarding_progress_tenant_idx" ON "onboarding_progress" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "onboarding_progress_status_idx" ON "onboarding_progress" USING btree ("status");--> statement-breakpoint
CREATE INDEX "individual_goals_user_idx" ON "individual_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "individual_goals_tenant_idx" ON "individual_goals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "individual_goals_status_idx" ON "individual_goals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "individual_goals_category_idx" ON "individual_goals" USING btree ("category");--> statement-breakpoint
CREATE INDEX "individual_goals_parent_idx" ON "individual_goals" USING btree ("parent_goal_id");--> statement-breakpoint
CREATE INDEX "strategic_goal_links_plan_idx" ON "strategic_goal_links" USING btree ("strategic_plan_id");--> statement-breakpoint
CREATE INDEX "strategic_goal_links_individual_idx" ON "strategic_goal_links" USING btree ("individual_goal_id");--> statement-breakpoint
CREATE INDEX "strategic_goal_links_program_idx" ON "strategic_goal_links" USING btree ("program_goal_id");--> statement-breakpoint
CREATE INDEX "strategic_plans_tenant_idx" ON "strategic_plans" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "strategic_plans_type_idx" ON "strategic_plans" USING btree ("plan_type");--> statement-breakpoint
CREATE INDEX "strategic_plans_status_idx" ON "strategic_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "strategic_plans_parent_idx" ON "strategic_plans" USING btree ("parent_plan_id");--> statement-breakpoint
CREATE INDEX "assessment_templates_agency_idx" ON "assessment_templates" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "assessment_templates_status_idx" ON "assessment_templates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assessment_templates_type_idx" ON "assessment_templates" USING btree ("assessment_type");--> statement-breakpoint
CREATE INDEX "assessment_invitations_assessment_idx" ON "assessment_invitations" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_invitations_rater_idx" ON "assessment_invitations" USING btree ("rater_id");--> statement-breakpoint
CREATE INDEX "assessment_invitations_status_idx" ON "assessment_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assessment_invitations_token_idx" ON "assessment_invitations" USING btree ("access_token");--> statement-breakpoint
CREATE INDEX "assessment_responses_invitation_idx" ON "assessment_responses" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "assessment_responses_complete_idx" ON "assessment_responses" USING btree ("is_complete");--> statement-breakpoint
CREATE INDEX "assessments_template_idx" ON "assessments" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "assessments_tenant_idx" ON "assessments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "assessments_subject_idx" ON "assessments" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "assessments_status_idx" ON "assessments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "mentoring_relationships_unique" ON "mentoring_relationships" USING btree ("mentor_id","mentee_id","relationship_type");--> statement-breakpoint
CREATE INDEX "mentoring_relationships_tenant_idx" ON "mentoring_relationships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "mentoring_relationships_mentor_idx" ON "mentoring_relationships" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "mentoring_relationships_mentee_idx" ON "mentoring_relationships" USING btree ("mentee_id");--> statement-breakpoint
CREATE INDEX "mentoring_relationships_status_idx" ON "mentoring_relationships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mentoring_action_items_session_idx" ON "mentoring_action_items" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "mentoring_action_items_relationship_idx" ON "mentoring_action_items" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX "mentoring_action_items_owner_idx" ON "mentoring_action_items" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "mentoring_action_items_status_idx" ON "mentoring_action_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mentoring_action_items_due_idx" ON "mentoring_action_items" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "mentoring_session_notes_session_idx" ON "mentoring_session_notes" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "mentoring_session_notes_author_idx" ON "mentoring_session_notes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "mentoring_session_prep_session_idx" ON "mentoring_session_prep" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "mentoring_session_prep_user_idx" ON "mentoring_session_prep" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mentoring_sessions_relationship_idx" ON "mentoring_sessions" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX "mentoring_sessions_date_idx" ON "mentoring_sessions" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "mentoring_sessions_status_idx" ON "mentoring_sessions" USING btree ("status");--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;