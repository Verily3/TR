ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "enrollments" ALTER COLUMN "tenant_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;