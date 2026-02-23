CREATE TABLE "site_counters" (
	"key" text PRIMARY KEY NOT NULL,
	"value" bigint NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "isAnonymous" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
INSERT INTO "site_counters" ("key", "value")
VALUES ('unique_visitors', 1)
ON CONFLICT ("key") DO NOTHING;
