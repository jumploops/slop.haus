ALTER TABLE "projects" ADD COLUMN "like_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "review_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "review_score_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "slop_score" numeric(4, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint

ALTER TABLE "comments" ADD COLUMN "review_score" integer;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "upvote_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint

CREATE TABLE "project_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text,
	"rater_type" "rater_type" NOT NULL,
	"rater_key_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "comment_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "project_likes" ADD CONSTRAINT "project_likes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_likes" ADD CONSTRAINT "project_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "project_likes" ADD CONSTRAINT "project_likes_unique" UNIQUE("project_id","rater_key_hash");--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_unique" UNIQUE("comment_id","user_id");--> statement-breakpoint

CREATE INDEX "project_likes_project_id_idx" ON "project_likes" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_likes_user_id_idx" ON "project_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comment_votes_comment_id_idx" ON "comment_votes" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "comment_votes_user_id_idx" ON "comment_votes" USING btree ("user_id");--> statement-breakpoint

DROP TABLE "project_votes";--> statement-breakpoint
