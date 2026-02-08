CREATE TYPE "public"."draft_status" AS ENUM('pending', 'scraping', 'analyzing', 'ready', 'submitted', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."url_type" AS ENUM('github', 'gitlab', 'npm', 'pypi', 'chrome_webstore', 'steam', 'live_site');--> statement-breakpoint
CREATE TABLE "enrichment_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"input_url" text NOT NULL,
	"detected_url_type" "url_type" NOT NULL,
	"scraped_content" jsonb,
	"scraped_metadata" jsonb,
	"screenshot_url" text,
	"suggested_title" varchar(255),
	"suggested_tagline" varchar(500),
	"suggested_description" text,
	"suggested_tools" jsonb,
	"suggested_vibe_percent" integer,
	"suggested_main_url" text,
	"suggested_repo_url" text,
	"final_title" varchar(255),
	"final_tagline" varchar(500),
	"final_description" text,
	"final_tools" jsonb,
	"final_vibe_percent" integer,
	"final_main_url" text,
	"final_repo_url" text,
	"status" "draft_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "moderation_events" ALTER COLUMN "labels" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "moderation_events" ALTER COLUMN "confidence_level" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_revisions" ADD COLUMN "changed_fields" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrichment_drafts" ADD CONSTRAINT "enrichment_drafts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrichment_drafts_user_id_idx" ON "enrichment_drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "enrichment_drafts_status_idx" ON "enrichment_drafts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "enrichment_drafts_expires_at_idx" ON "enrichment_drafts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "enrichment_drafts_deleted_at_idx" ON "enrichment_drafts" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "moderation_events" DROP COLUMN "labels_detailed";