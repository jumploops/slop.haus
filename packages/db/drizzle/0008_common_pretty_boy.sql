ALTER TABLE "projects" ADD COLUMN "featured_at" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "featured_by_user_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_featured_by_user_id_user_id_fk" FOREIGN KEY ("featured_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_status_featured_at_idx" ON "projects" USING btree ("status","featured_at");--> statement-breakpoint
CREATE INDEX "projects_featured_at_idx" ON "projects" USING btree ("featured_at");