CREATE TABLE "mahjong_participant" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"tickets_used" integer DEFAULT 1 NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mahjong_session" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"player_count" integer DEFAULT 4 NOT NULL,
	"initial_points" integer DEFAULT 25000 NOT NULL,
	"ticket_value" integer DEFAULT 100 NOT NULL,
	"multiplier" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'upcoming',
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mahjong_participant" ADD CONSTRAINT "mahjong_participant_session_id_mahjong_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mahjong_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mahjong_participant" ADD CONSTRAINT "mahjong_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mahjong_session" ADD CONSTRAINT "mahjong_session_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mahjong_participant_sessionId_idx" ON "mahjong_participant" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "mahjong_participant_userId_idx" ON "mahjong_participant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mahjong_session_createdBy_idx" ON "mahjong_session" USING btree ("created_by");