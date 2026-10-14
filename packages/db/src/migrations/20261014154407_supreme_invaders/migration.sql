CREATE TABLE "ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"type" "ledger_type" NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"entry_direction" "entry_direction" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"question" text NOT NULL,
	"description" text NOT NULL,
	"outcome" "outcome",
	"resolved_by" uuid,
	"status" "market_status" DEFAULT 'DRAFT'::"market_status" NOT NULL,
	"resolved_at" timestamp with time zone,
	"closes_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"side" "side" NOT NULL,
	"outcome" "outcome" NOT NULL,
	"price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"filled_quantity" integer DEFAULT 0 NOT NULL,
	"user_id" uuid NOT NULL,
	"market_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'OPEN'::"order_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"market_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"outcome" "outcome" NOT NULL,
	"avg_price" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"ask_order_id" uuid NOT NULL,
	"bid_order_id" uuid NOT NULL,
	"market_id" uuid NOT NULL,
	"outcome" "outcome" NOT NULL,
	"quantity" integer NOT NULL,
	"price" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" text NOT NULL UNIQUE,
	"email" text NOT NULL UNIQUE,
	"balance" integer DEFAULT 0 NOT NULL,
	"role" "role" DEFAULT 'USER'::"role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ledger_user_time_idx" ON "ledger" ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "markets_status_closes_idx" ON "markets" ("status","closes_at");--> statement-breakpoint
CREATE INDEX "markets_status_created_idx" ON "markets" ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "orders_book_idx" ON "orders" ("market_id","outcome","side","status","price","created_at");--> statement-breakpoint
CREATE INDEX "orders_open_book_idx" ON "orders" ("market_id","outcome","side","price") WHERE "status" in ('OPEN','PARTIALLY_FILLED');--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" ("user_id","market_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "positions_user_market_outcome_uidx" ON "positions" ("user_id","market_id","outcome");--> statement-breakpoint
CREATE INDEX "trades_market_time_idx" ON "trades" ("market_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "markets" ADD CONSTRAINT "markets_resolved_by_users_id_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_market_id_markets_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id");--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_market_id_markets_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id");--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_ask_order_id_orders_id_fkey" FOREIGN KEY ("ask_order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_bid_order_id_orders_id_fkey" FOREIGN KEY ("bid_order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_market_id_markets_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id");