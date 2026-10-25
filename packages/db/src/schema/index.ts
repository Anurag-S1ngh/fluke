import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  entryDirectionEnum,
  ledgerTypeEnum,
  marketStatusEnum,
  orderStatusEnum,
  outcomeEnum,
  roleEnum,
  sideEnum,
} from "./enums";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  balance: integer("balance").notNull().default(0), // last two digits represent decimals (e.g. 12.05 -> 1205)
  reservedBalance: integer("reserved_balance").notNull().default(0),
  role: roleEnum("role").notNull().default("USER"),
  lastDailyGrantAt: timestamp("last_daily_grant_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const marketsTable = pgTable(
  "markets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    question: text("question").notNull(),
    description: text("description").notNull(),
    outcome: outcomeEnum("outcome"),
    resolvedBy: uuid("resolved_by").references(() => usersTable.id),
    status: marketStatusEnum("status").notNull().default("DRAFT"),

    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("markets_status_closes_idx").on(t.status, t.closesAt),
    index("markets_status_created_idx").on(t.status, t.createdAt.desc()),
  ],
);

export const ordersTable = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    side: sideEnum("side").notNull(),
    outcome: outcomeEnum("outcome").notNull(),
    price: integer("price").notNull(), // last two digist represent decimals (e.g. 12.05 -> 1205)
    quantity: integer("quantity").notNull(),
    filledQuantity: integer("filled_quantity").notNull().default(0),
    userId: uuid("user_id")
      .references(() => usersTable.id)
      .notNull(),
    marketId: uuid("market_id")
      .references(() => marketsTable.id)
      .notNull(),
    status: orderStatusEnum("status").notNull().default("OPEN"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("orders_book_idx").on(t.marketId, t.outcome, t.side, t.status, t.price, t.createdAt),
    index("orders_open_book_idx")
      .on(t.marketId, t.outcome, t.side, t.price)
      .where(sql`"status" in ('OPEN','PARTIALLY_FILLED')`),
    index("orders_user_idx").on(t.userId, t.marketId, t.status, t.createdAt),
  ],
);

export const tradesTable = pgTable(
  "trades",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    askOrderId: uuid("ask_order_id")
      .references(() => ordersTable.id)
      .notNull(),
    bidOrderId: uuid("bid_order_id")
      .references(() => ordersTable.id)
      .notNull(),
    marketId: uuid("market_id")
      .references(() => marketsTable.id)
      .notNull(),
    outcome: outcomeEnum("outcome").notNull(),
    quantity: integer("quantity").notNull(),
    price: integer("price").notNull(), // last two digist represent decimals (e.g. 12.05 -> 1205)

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("trades_market_time_idx").on(t.marketId, t.createdAt.desc())],
);

export const positionsTable = pgTable(
  "positions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => usersTable.id)
      .notNull(),
    marketId: uuid("market_id")
      .references(() => marketsTable.id)
      .notNull(),
    quantity: integer("quantity").notNull(),
    reservedQuantity: integer("reserved_quantity").notNull().default(0),
    outcome: outcomeEnum("outcome").notNull(),
    avgPrice: integer("avg_price").notNull(), // last two digist represent decimals
    settledAt: timestamp("settled_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("positions_user_market_outcome_uidx").on(t.userId, t.marketId, t.outcome)],
);

export const ledgerTable = pgTable(
  "ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: ledgerTypeEnum("type").notNull(),
    userId: uuid("user_id")
      .references(() => usersTable.id)
      .notNull(),
    amount: integer("amount").notNull(),
    entryDirection: entryDirectionEnum("entry_direction").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("ledger_user_time_idx").on(t.userId, t.createdAt.desc())],
);

export * from "./enums";
