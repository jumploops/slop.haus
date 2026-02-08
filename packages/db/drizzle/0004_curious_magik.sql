DO $$ BEGIN
 CREATE TYPE "public"."draft_screenshot_source" AS ENUM('firecrawl', 'readme_image', 'github_og');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (
   SELECT 1
   FROM pg_type t
   JOIN pg_enum e ON t.oid = e.enumtypid
   WHERE t.typname = 'media_source' AND e.enumlabel = 'readme_image'
 ) THEN
   ALTER TYPE "public"."media_source" ADD VALUE 'readme_image';
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (
   SELECT 1
   FROM pg_type t
   JOIN pg_enum e ON t.oid = e.enumtypid
   WHERE t.typname = 'media_source' AND e.enumlabel = 'github_og'
 ) THEN
   ALTER TYPE "public"."media_source" ADD VALUE 'github_og';
 END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limits_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locks" (
	"key" text NOT NULL,
	"holder" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "locks_key_pk" PRIMARY KEY("key")
);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "slop_score" SET DATA TYPE numeric(4, 2);--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "slop_score" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "hot_score" numeric(10, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrichment_drafts" ADD COLUMN IF NOT EXISTS "screenshot_source" "draft_screenshot_source";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_window_start_idx" ON "rate_limits" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_hot_score_idx" ON "projects" USING btree ("hot_score");--> statement-breakpoint
UPDATE "projects"
SET "hot_score" = ("slop_score" / power(((extract(epoch from (now() - "created_at")) / 3600) + 2), 1.8))
WHERE "hot_score" = 0;
