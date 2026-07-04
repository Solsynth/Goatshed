ALTER TABLE "gaming_session" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'upcoming';
--> statement-breakpoint
ALTER TABLE "session_participant" ADD COLUMN IF NOT EXISTS "tickets_used" integer DEFAULT 1;
