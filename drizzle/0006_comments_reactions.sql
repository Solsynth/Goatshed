ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "nick" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comment" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"parent_id" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_postId_idx" ON "comment" ("post_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_authorId_idx" ON "comment" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_parentId_idx" ON "comment" ("parent_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reaction" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"symbol" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reaction_postId_userId_symbol_unique" UNIQUE("post_id","user_id","symbol")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reaction_postId_idx" ON "reaction" ("post_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reaction_userId_idx" ON "reaction" ("user_id");
