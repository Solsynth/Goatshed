CREATE TABLE "gaming_session" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"ticket_cost" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_participant" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gaming_session" ADD CONSTRAINT "gaming_session_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "session_participant" ADD CONSTRAINT "session_participant_session_id_gaming_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gaming_session"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "session_participant" ADD CONSTRAINT "session_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "gaming_session_createdBy_idx" ON "gaming_session" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX "session_participant_sessionId_idx" ON "session_participant" USING btree ("session_id");
--> statement-breakpoint
CREATE INDEX "session_participant_userId_idx" ON "session_participant" USING btree ("user_id");
