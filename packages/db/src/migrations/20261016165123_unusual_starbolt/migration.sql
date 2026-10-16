ALTER TABLE "positions" ADD COLUMN "reserved_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reserved_balance" integer DEFAULT 0 NOT NULL;