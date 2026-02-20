CREATE TYPE "public"."survey_question_type" AS ENUM('single_choice', 'multiple_choice', 'text', 'rating', 'nps', 'yes_no', 'ranking');--> statement-breakpoint
CREATE TYPE "public"."survey_status" AS ENUM('draft', 'active', 'closed');--> statement-breakpoint
ALTER TYPE "public"."content_type" ADD VALUE 'survey';--> statement-breakpoint
CREATE TABLE "survey_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"text" text NOT NULL,
	"description" text,
	"type" "survey_question_type" NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"user_id" uuid,
	"enrollment_id" uuid,
	"session_token" varchar(64),
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"agency_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "survey_status" DEFAULT 'draft' NOT NULL,
	"anonymous" boolean DEFAULT false NOT NULL,
	"require_login" boolean DEFAULT true NOT NULL,
	"allow_multiple_responses" boolean DEFAULT false NOT NULL,
	"show_results_to_respondent" boolean DEFAULT false NOT NULL,
	"share_token" varchar(64),
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "surveys_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "survey_questions_survey_idx" ON "survey_questions" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_responses_survey_idx" ON "survey_responses" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_responses_user_idx" ON "survey_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "surveys_tenant_idx" ON "surveys" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "surveys_agency_idx" ON "surveys" USING btree ("agency_id");--> statement-breakpoint
CREATE UNIQUE INDEX "surveys_share_token_idx" ON "surveys" USING btree ("share_token");