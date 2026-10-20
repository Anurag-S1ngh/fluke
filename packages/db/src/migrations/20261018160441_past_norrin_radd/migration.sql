ALTER TYPE "ledger_type" ADD VALUE 'DAILY_GRANT';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_daily_grant_at" timestamp with time zone;