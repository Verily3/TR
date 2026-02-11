CREATE TABLE "lesson_discussions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_discussions" ADD CONSTRAINT "lesson_discussions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_discussions" ADD CONSTRAINT "lesson_discussions_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_discussions" ADD CONSTRAINT "lesson_discussions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_discussions_lesson_idx" ON "lesson_discussions" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_discussions_enrollment_idx" ON "lesson_discussions" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "lesson_discussions_user_idx" ON "lesson_discussions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lesson_discussions_created_idx" ON "lesson_discussions" USING btree ("created_at");