CREATE TABLE "program_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"lesson_id" uuid,
	"name" varchar(255) NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"category" varchar(50) DEFAULT 'document' NOT NULL,
	"external_url" text,
	"order" integer DEFAULT 0 NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "program_resources" ADD CONSTRAINT "program_resources_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_resources" ADD CONSTRAINT "program_resources_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_resources" ADD CONSTRAINT "program_resources_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "program_resources_program_id_idx" ON "program_resources" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "program_resources_lesson_id_idx" ON "program_resources" USING btree ("lesson_id");