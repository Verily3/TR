CREATE TYPE "public"."scorecard_item_status" AS ENUM('on_track', 'at_risk', 'needs_attention');--> statement-breakpoint
CREATE TYPE "public"."scorecard_metric_trend" AS ENUM('up', 'down', 'neutral');--> statement-breakpoint
CREATE TABLE "scorecard_competencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reviewer_id" uuid,
	"ordinal" integer DEFAULT 0 NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"self_rating" integer DEFAULT 0 NOT NULL,
	"manager_rating" integer DEFAULT 0 NOT NULL,
	"period" varchar(20) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorecard_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"ordinal" integer DEFAULT 0 NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"score" integer DEFAULT 0 NOT NULL,
	"status" "scorecard_item_status" DEFAULT 'on_track' NOT NULL,
	"period" varchar(20) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorecard_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"scorecard_item_id" uuid,
	"category" varchar(100) NOT NULL,
	"ordinal" integer DEFAULT 0 NOT NULL,
	"name" varchar(255) NOT NULL,
	"target_value" varchar(100) DEFAULT '' NOT NULL,
	"actual_value" varchar(100) DEFAULT '' NOT NULL,
	"actual_numeric" real,
	"target_numeric" real,
	"change_label" varchar(50),
	"trend" "scorecard_metric_trend" DEFAULT 'neutral' NOT NULL,
	"invert_trend" integer DEFAULT 0 NOT NULL,
	"period" varchar(20) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scorecard_competencies" ADD CONSTRAINT "scorecard_competencies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_competencies" ADD CONSTRAINT "scorecard_competencies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_competencies" ADD CONSTRAINT "scorecard_competencies_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_items" ADD CONSTRAINT "scorecard_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_items" ADD CONSTRAINT "scorecard_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_metrics" ADD CONSTRAINT "scorecard_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_metrics" ADD CONSTRAINT "scorecard_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_metrics" ADD CONSTRAINT "scorecard_metrics_scorecard_item_id_scorecard_items_id_fk" FOREIGN KEY ("scorecard_item_id") REFERENCES "public"."scorecard_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scorecard_competencies_tenant_idx" ON "scorecard_competencies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "scorecard_competencies_user_idx" ON "scorecard_competencies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scorecard_competencies_period_idx" ON "scorecard_competencies" USING btree ("period");--> statement-breakpoint
CREATE INDEX "scorecard_items_tenant_idx" ON "scorecard_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "scorecard_items_user_idx" ON "scorecard_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scorecard_items_period_idx" ON "scorecard_items" USING btree ("period");--> statement-breakpoint
CREATE INDEX "scorecard_metrics_tenant_idx" ON "scorecard_metrics" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "scorecard_metrics_user_idx" ON "scorecard_metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scorecard_metrics_period_idx" ON "scorecard_metrics" USING btree ("period");--> statement-breakpoint
CREATE INDEX "scorecard_metrics_category_idx" ON "scorecard_metrics" USING btree ("category");--> statement-breakpoint
CREATE INDEX "scorecard_metrics_item_idx" ON "scorecard_metrics" USING btree ("scorecard_item_id");