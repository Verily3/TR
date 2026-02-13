CREATE TABLE "assessment_benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"sample_size" integer DEFAULT 0 NOT NULL,
	"benchmark_data" jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "individual_goals" ADD COLUMN "assessment_id" uuid;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "computed_results" jsonb;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "program_id" uuid;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "enrollment_id" uuid;--> statement-breakpoint
ALTER TABLE "assessment_benchmarks" ADD CONSTRAINT "assessment_benchmarks_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_benchmarks" ADD CONSTRAINT "assessment_benchmarks_template_id_assessment_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."assessment_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_benchmarks_agency_template_idx" ON "assessment_benchmarks" USING btree ("agency_id","template_id");--> statement-breakpoint
CREATE INDEX "assessment_benchmarks_template_idx" ON "assessment_benchmarks" USING btree ("template_id");--> statement-breakpoint
ALTER TABLE "individual_goals" ADD CONSTRAINT "individual_goals_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "individual_goals_assessment_idx" ON "individual_goals" USING btree ("assessment_id");