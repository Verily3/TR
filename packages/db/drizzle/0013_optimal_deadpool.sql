ALTER TABLE "assessment_invitations" ALTER COLUMN "rater_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assessments" ALTER COLUMN "subject_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_invitations" ADD COLUMN "rater_email" varchar(255);--> statement-breakpoint
ALTER TABLE "assessment_invitations" ADD COLUMN "rater_first_name" varchar(100);--> statement-breakpoint
ALTER TABLE "assessment_invitations" ADD COLUMN "rater_last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "assessment_invitations" ADD COLUMN "added_by" varchar(20) DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "subject_email" varchar(255);--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "subject_first_name" varchar(100);--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "subject_last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "subject_setup_token" varchar(64);--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "subject_setup_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "subject_can_add_raters" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "invitations_rater_email_idx" ON "assessment_invitations" USING btree ("rater_email");--> statement-breakpoint
CREATE INDEX "assessments_setup_token_idx" ON "assessments" USING btree ("subject_setup_token");--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subject_setup_token_unique" UNIQUE("subject_setup_token");