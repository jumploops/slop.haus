CREATE TYPE "public"."username_source" AS ENUM('github', 'google_random', 'manual', 'seed');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "usernameSource" "username_source" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
UPDATE "user"
SET "username" = regexp_replace(
  regexp_replace(
    lower(
      regexp_replace(
        coalesce(nullif("name", ''), split_part("email", '@', 1), 'user'),
        '[^a-zA-Z0-9_]+',
        '_',
        'g'
      )
    ),
    '_+',
    '_',
    'g'
  ),
  '^_+|_+$',
  '',
  'g'
);
--> statement-breakpoint
UPDATE "user"
SET "username" = concat('user_', substring("id" from 1 for 8))
WHERE "username" IS NULL OR "username" = '';
--> statement-breakpoint
WITH ranked AS (
  SELECT
    id,
    username,
    row_number() OVER (
      PARTITION BY username
      ORDER BY "createdAt", id
    ) AS rn
  FROM "user"
)
UPDATE "user" AS u
SET "username" = CASE
  WHEN ranked.rn = 1 THEN ranked.username
  ELSE concat(ranked.username, '_', ranked.rn)
END
FROM ranked
WHERE ranked.id = u.id;
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");
