/**
 * Demo data seeder — pure inserts, no service layer.
 *
 * Everything the trading engine expects is computed by hand here:
 *   - resting BIDs lock cash out of `balance` into `reserved_balance`
 *   - resting ASKs reserve shares on top of an endowed position
 *   - filled orders ship with matching trades and rolled-up positions
 *   - resolved/refunded markets carry payouts, releases and `settled_at`
 *
 * Run from apps/server (Varlock loads apps/server/.env):
 *   bun run db:seed
 *   bun run db:seed -- --reset
 */
import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import "varlock/auto-load";

import { ENV } from "./env";
import { createDb } from "./index";
import {
  ledgerTable,
  marketsTable,
  ordersTable,
  positionsTable,
  tradesTable,
  usersTable,
} from "./schema/index";

const db = createDb(ENV);

type Outcome = "YES" | "NO";
type Side = "BID" | "ASK";
type MarketStatus = "DRAFT" | "OPEN" | "CLOSED" | "RESOLVED" | "REFUND";
type LedgerType = "ASK" | "BID" | "REFUND" | "PAYOUT" | "DAILY_GRANT";

/** Last two digits are decimals, so 1_000_000 is $10,000.00. */
const START_BALANCE = 1_000_000;
const PAYOUT_PER_SHARE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

const ADMIN = {
  username: "dunamis2070",
  email: "anuragsingh2313@gmail.com",
};

const TRADERS = [
  { username: "maya", email: "maya@fluke.test" },
  { username: "dev", email: "dev@fluke.test" },
  { username: "ines", email: "ines@fluke.test" },
  { username: "kofi", email: "kofi@fluke.test" },
  { username: "lena", email: "lena@fluke.test" },
  { username: "omar", email: "omar@fluke.test" },
  { username: "priya", email: "priya@fluke.test" },
  { username: "sven", email: "sven@fluke.test" },
  { username: "tessa", email: "tessa@fluke.test" },
];

const SEED_EMAILS = [ADMIN.email, ...TRADERS.map((trader) => trader.email)];

type MarketSpec = {
  question: string;
  description: string;
  status: MarketStatus;
  outcome: Outcome | null;
  closesInDays: number;
  /** Target YES price in cents; NO sits at 100 minus this. */
  target: number;
  ladder: boolean;
  trades: number;
};

const MARKET_SPECS: MarketSpec[] = [
  {
    question: "Will the central bank cut rates before the end of the year?",
    description:
      "Resolves YES if the central bank lowers its policy rate at least once on or before December 31, as reported on its own website.",
    status: "OPEN",
    outcome: null,
    closesInDays: 45,
    target: 64,
    ladder: true,
    trades: 6,
  },
  {
    question: "Will the heavy-lift rocket reach orbit on its next flight?",
    description:
      "Resolves YES if the vehicle completes a full orbital insertion on its next launch attempt, per the operator's mission webcast.",
    status: "OPEN",
    outcome: null,
    closesInDays: 28,
    target: 71,
    ladder: true,
    trades: 5,
  },
  {
    question: "Will the incumbent hold their seat in the next election?",
    description:
      "Resolves YES if the sitting member is declared the winner by the official electoral commission.",
    status: "OPEN",
    outcome: null,
    closesInDays: 60,
    target: 47,
    ladder: true,
    trades: 7,
  },
  {
    question: "Will this year set a new global heat record?",
    description:
      "Resolves YES if the annual global average surface temperature is reported as the warmest on record by the reference agency.",
    status: "OPEN",
    outcome: null,
    closesInDays: 52,
    target: 58,
    ladder: true,
    trades: 4,
  },
  {
    question: "Will the next flagship phone ship with a foldable display?",
    description:
      "Resolves YES if the manufacturer's next flagship announcement lists a foldable primary display.",
    status: "OPEN",
    outcome: null,
    closesInDays: 18,
    target: 18,
    ladder: true,
    trades: 3,
  },
  {
    question: "Will the home team reach the playoffs this season?",
    description:
      "Resolves YES if the club qualifies for the post-season bracket by the final matchday.",
    status: "OPEN",
    outcome: null,
    closesInDays: 33,
    target: 36,
    ladder: true,
    trades: 5,
  },
  {
    question: "Will the metro extension open on schedule?",
    description:
      "Resolves YES if the new line carries paying passengers on or before the published opening date.",
    status: "OPEN",
    outcome: null,
    closesInDays: 8,
    target: 82,
    ladder: true,
    trades: 4,
  },
  {
    question: "Will the summit produce a signed agreement?",
    description:
      "Resolves YES if a final agreement is signed by all attending delegations before the summit closes.",
    status: "CLOSED",
    outcome: null,
    closesInDays: -6,
    target: 55,
    ladder: false,
    trades: 5,
  },
  {
    question: "Will the film cross one billion at the box office?",
    description:
      "Resolves YES if worldwide gross passes one billion USD within 90 days of release.",
    status: "CLOSED",
    outcome: null,
    closesInDays: -2,
    target: 41,
    ladder: false,
    trades: 4,
  },
  {
    question: "Did the bill pass the upper chamber?",
    description:
      "Resolved YES: the bill cleared the upper chamber with 54 votes, per the official roll call.",
    status: "RESOLVED",
    outcome: "YES",
    closesInDays: -20,
    target: 62,
    ladder: false,
    trades: 6,
  },
  {
    question: "Did the rover land inside the target basin?",
    description:
      "Resolved YES: telemetry confirmed touchdown inside the target basin on the planned sol.",
    status: "RESOLVED",
    outcome: "YES",
    closesInDays: -35,
    target: 74,
    ladder: false,
    trades: 5,
  },
  {
    question: "Did the club finish top of the table?",
    description: "Resolved NO: the club finished third, four points behind the leaders.",
    status: "RESOLVED",
    outcome: "NO",
    closesInDays: -14,
    target: 29,
    ladder: false,
    trades: 6,
  },
  {
    question: "Will the launch happen before the deadline?",
    description:
      "Refunded: the launch window was withdrawn, so every position was returned at cost.",
    status: "REFUND",
    outcome: null,
    closesInDays: -9,
    target: 68,
    ladder: true,
    trades: 3,
  },
  {
    question: "Will the new stadium open before next season?",
    description: "Draft waiting on a confirmed handover date. Not yet published to the market.",
    status: "DRAFT",
    outcome: null,
    closesInDays: 90,
    target: 50,
    ladder: false,
    trades: 0,
  },
];

const SEED_QUESTIONS = MARKET_SPECS.map((spec) => spec.question);

type Account = { balance: number; reservedBalance: number };

type PositionState = {
  id: string;
  userId: string;
  marketId: string;
  outcome: Outcome;
  quantity: number;
  reservedQuantity: number;
  avgPrice: number;
  settledAt: Date | null;
  createdAt: Date;
};

type OrderState = {
  id: string;
  marketId: string;
  userId: string;
  side: Side;
  outcome: Outcome;
  price: number;
  quantity: number;
  filledQuantity: number;
  status: "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
};

type TradeState = {
  id: string;
  marketId: string;
  askOrderId: string;
  bidOrderId: string;
  outcome: Outcome;
  price: number;
  quantity: number;
  createdAt: Date;
};

type LedgerState = {
  id: string;
  userId: string;
  type: LedgerType;
  amount: number;
  entryDirection: "DEBIT" | "CREDIT";
  createdAt: Date;
};

type MarketState = {
  id: string;
  question: string;
  description: string;
  status: MarketStatus;
  outcome: Outcome | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  closesAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const accounts = new Map<string, Account>();
const positions: PositionState[] = [];
const orders: OrderState[] = [];
const trades: TradeState[] = [];
const ledger: LedgerState[] = [];
const markets: MarketState[] = [];

const day = (offset: number) => new Date(Date.now() + offset * DAY_MS);

const account = (userId: string) => {
  const found = accounts.get(userId);
  if (!found) throw new Error(`missing account ${userId}`);
  return found;
};

const post = (
  userId: string,
  type: LedgerType,
  amount: number,
  entryDirection: "DEBIT" | "CREDIT",
  at: Date,
) => {
  if (amount <= 0) return;
  ledger.push({ id: randomUUID(), userId, type, amount, entryDirection, createdAt: at });
};

const findPosition = (userId: string, marketId: string, outcome: Outcome) =>
  positions.find(
    (position) =>
      position.userId === userId && position.marketId === marketId && position.outcome === outcome,
  );

const requirePosition = (userId: string, marketId: string, outcome: Outcome) => {
  const found = findPosition(userId, marketId, outcome);
  if (!found) throw new Error("seed asked to sell shares it never endowed");
  return found;
};

/** Adds shares, rolling the average price the way applyFill does. */
const addShares = (
  userId: string,
  marketId: string,
  outcome: Outcome,
  quantity: number,
  price: number,
  at: Date,
) => {
  const existing = findPosition(userId, marketId, outcome);
  if (existing) {
    const total = existing.quantity + quantity;
    existing.avgPrice = Math.round(
      (existing.quantity * existing.avgPrice + quantity * price) / total,
    );
    existing.quantity = total;
    return;
  }
  positions.push({
    id: randomUUID(),
    userId,
    marketId,
    outcome,
    quantity,
    reservedQuantity: 0,
    avgPrice: price,
    settledAt: null,
    createdAt: at,
  });
};

const debitCash = (userId: string, amount: number, type: LedgerType, at: Date) => {
  const owner = account(userId);
  owner.balance -= amount;
  post(userId, type, amount, "DEBIT", at);
};

const creditCash = (userId: string, amount: number, type: LedgerType, at: Date) => {
  const owner = account(userId);
  owner.balance += amount;
  post(userId, type, amount, "CREDIT", at);
};

/** Buyer endows or buys shares outside the book (used for market-maker stock). */
const endow = (
  userId: string,
  marketId: string,
  outcome: Outcome,
  quantity: number,
  price: number,
  at: Date,
) => {
  debitCash(userId, quantity * price, "BID", at);
  addShares(userId, marketId, outcome, quantity, price, at);
};

/** Resting bid: locks `price * quantity` from balance into reserved balance. */
const restBid = (
  userId: string,
  marketId: string,
  outcome: Outcome,
  price: number,
  quantity: number,
  at: Date,
) => {
  const lock = price * quantity;
  const owner = account(userId);
  if (owner.balance < lock) throw new Error("seed bid exceeds available cash");
  owner.balance -= lock;
  owner.reservedBalance += lock;
  post(userId, "BID", lock, "DEBIT", at);
  orders.push({
    id: randomUUID(),
    marketId,
    userId,
    side: "BID",
    outcome,
    price,
    quantity,
    filledQuantity: 0,
    status: "OPEN",
    createdAt: at,
    updatedAt: at,
  });
};

/** Resting ask: reserves shares the seller already holds. */
const restAsk = (
  userId: string,
  marketId: string,
  outcome: Outcome,
  price: number,
  quantity: number,
  at: Date,
) => {
  const held = requirePosition(userId, marketId, outcome);
  if (held.quantity - held.reservedQuantity < quantity) {
    throw new Error("seed ask exceeds unreserved shares");
  }
  held.reservedQuantity += quantity;
  orders.push({
    id: randomUUID(),
    marketId,
    userId,
    side: "ASK",
    outcome,
    price,
    quantity,
    filledQuantity: 0,
    status: "OPEN",
    createdAt: at,
    updatedAt: at,
  });
};

/** Filled pair plus trade row, mirrored into balances and positions. */
const fillTrade = (
  marketId: string,
  outcome: Outcome,
  price: number,
  quantity: number,
  buyerId: string,
  sellerId: string,
  at: Date,
) => {
  const held = requirePosition(sellerId, marketId, outcome);
  if (held.quantity - held.reservedQuantity < quantity) {
    throw new Error("seed trade exceeds seller's unreserved shares");
  }

  debitCash(buyerId, price * quantity, "BID", at);
  addShares(buyerId, marketId, outcome, quantity, price, at);

  held.quantity -= quantity;
  creditCash(sellerId, price * quantity, "ASK", at);

  const bidId = randomUUID();
  const askId = randomUUID();
  const pair = (id: string, side: Side, userId: string) => ({
    id,
    marketId,
    userId,
    side,
    outcome,
    price,
    quantity,
    filledQuantity: quantity,
    status: "FILLED" as const,
    createdAt: at,
    updatedAt: at,
  });

  orders.push(pair(bidId, "BID", buyerId));
  orders.push(pair(askId, "ASK", sellerId));
  trades.push({
    id: randomUUID(),
    marketId,
    askOrderId: askId,
    bidOrderId: bidId,
    outcome,
    price,
    quantity,
    createdAt: at,
  });
};

/** Settles a market the way resolveMarket does, using only local state. */
const settle = (market: MarketState, result: Outcome | "REFUND", at: Date) => {
  const isRefund = result === "REFUND";

  for (const position of positions) {
    if (position.marketId !== market.id) continue;
    const amount = isRefund
      ? position.quantity * position.avgPrice
      : position.outcome === result
        ? position.quantity * PAYOUT_PER_SHARE
        : 0;
    if (amount > 0) {
      creditCash(position.userId, amount, isRefund ? "REFUND" : "PAYOUT", at);
    }
    position.reservedQuantity = 0;
    position.settledAt = at;
  }

  for (const order of orders) {
    if (order.marketId !== market.id) continue;
    if (order.status !== "OPEN" && order.status !== "PARTIALLY_FILLED") continue;
    const remainder = order.quantity - order.filledQuantity;
    if (remainder > 0) {
      if (order.side === "BID") {
        const release = order.price * remainder;
        const owner = account(order.userId);
        owner.reservedBalance -= release;
        owner.balance += release;
        post(order.userId, "BID", release, "CREDIT", at);
      } else {
        const held = requirePosition(order.userId, market.id, order.outcome);
        held.reservedQuantity -= remainder;
      }
    }
    order.status = "CANCELLED";
    order.updatedAt = at;
  }

  market.status = isRefund ? "REFUND" : "RESOLVED";
  market.outcome = isRefund ? null : result;
  market.resolvedBy = adminId;
  market.resolvedAt = at;
  market.updatedAt = at;
};

const clampPrice = (value: number) => Math.min(97, Math.max(3, value));

const adminId = randomUUID();
const userIds = new Map<string, string>();

async function resetSeedData() {
  const existingUsers = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(inArray(usersTable.email, SEED_EMAILS));
  const existingMarkets = await db
    .select({ id: marketsTable.id })
    .from(marketsTable)
    .where(inArray(marketsTable.question, SEED_QUESTIONS));

  const userIdList = existingUsers.map((row) => row.id);
  const marketIdList = existingMarkets.map((row) => row.id);

  if (userIdList.length > 0) {
    const foreign = await db
      .select({ id: marketsTable.id, question: marketsTable.question })
      .from(marketsTable)
      .where(inArray(marketsTable.resolvedBy, userIdList));
    const stragglers = foreign.filter((row) => !marketIdList.includes(row.id));
    if (stragglers.length > 0) {
      throw new Error(
        `refusing to reset: the seed admin resolved ${stragglers.length} non-seed market(s), ` +
          `starting with "${stragglers[0]?.question ?? "unknown"}". Resolve that first.`,
      );
    }
  }

  if (marketIdList.length > 0) {
    await db.delete(tradesTable).where(inArray(tradesTable.marketId, marketIdList));
    await db.delete(ordersTable).where(inArray(ordersTable.marketId, marketIdList));
    await db.delete(positionsTable).where(inArray(positionsTable.marketId, marketIdList));
    await db.delete(marketsTable).where(inArray(marketsTable.id, marketIdList));
  }
  if (userIdList.length > 0) {
    await db.delete(ledgerTable).where(inArray(ledgerTable.userId, userIdList));
    await db.delete(usersTable).where(inArray(usersTable.id, userIdList));
  }

  console.log(`reset: removed ${marketIdList.length} market(s) and ${userIdList.length} user(s)`);
}

async function main() {
  const wantsReset = process.argv.includes("--reset");

  if (wantsReset) await resetSeedData();

  const [existingAdmin] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(inArray(usersTable.email, [ADMIN.email]))
    .limit(1);

  if (existingAdmin && !wantsReset) {
    console.log("seed skipped: demo admin already exists (use --reset to rebuild)");
    return;
  }

  const now = new Date();
  const userRows: (typeof usersTable.$inferInsert)[] = [];
  userIds.set(ADMIN.email, adminId);

  accounts.set(adminId, { balance: 0, reservedBalance: 0 });
  userRows.push({
    id: adminId,
    username: ADMIN.username,
    email: ADMIN.email,
    balance: 0,
    reservedBalance: 0,
    role: "ADMIN",
    createdAt: day(-120),
    updatedAt: now,
  });

  for (const [index, trader] of TRADERS.entries()) {
    const id = randomUUID();
    userIds.set(trader.email, id);
    accounts.set(id, { balance: START_BALANCE, reservedBalance: 0 });
    post(id, "DAILY_GRANT", START_BALANCE, "CREDIT", day(-90 + index));
    userRows.push({
      id,
      username: trader.username,
      email: trader.email,
      balance: 0,
      reservedBalance: 0,
      role: "USER",
      createdAt: day(-90 + index),
      updatedAt: now,
    });
  }

  const traderIds = TRADERS.map((trader) => userIds.get(trader.email) as string);
  const makers = traderIds.slice(0, 3);

  for (const [index, spec] of MARKET_SPECS.entries()) {
    const createdAt = day(-30 + index);
    const closesAt = day(spec.closesInDays);
    const marketId = randomUUID();
    const state: MarketState = {
      id: marketId,
      question: spec.question,
      description: spec.description,
      status: spec.status,
      outcome: spec.outcome,
      resolvedBy: null,
      resolvedAt: null,
      closesAt,
      createdAt,
      updatedAt: createdAt,
    };

    const yesMid = spec.target;
    const noMid = 100 - spec.target;

    if (spec.status !== "DRAFT") {
      for (const outcome of ["YES", "NO"] as const) {
        const mid = outcome === "YES" ? yesMid : noMid;
        for (const maker of makers) {
          endow(maker, marketId, outcome, 400, mid, createdAt);
        }
      }

      if (spec.ladder) {
        const offsets = [-9, -5, -2, 2, 5, 9];
        for (const [step, offset] of offsets.entries()) {
          for (const outcome of ["YES", "NO"] as const) {
            const mid = outcome === "YES" ? yesMid : noMid;
            const maker = makers[step % makers.length] as string;
            const price = clampPrice(mid + offset);
            const quantity = 40 + ((step * 17 + index * 11) % 60);
            if (offset < 0) {
              restBid(
                maker,
                marketId,
                outcome,
                price,
                quantity,
                new Date(createdAt.getTime() + step * 60_000),
              );
            } else {
              restAsk(
                maker,
                marketId,
                outcome,
                price,
                quantity,
                new Date(createdAt.getTime() + step * 60_000),
              );
            }
          }
        }
      }

      for (let n = 0; n < spec.trades; n += 1) {
        const outcome: Outcome = n % 3 === 0 ? "NO" : "YES";
        const mid = outcome === "YES" ? yesMid : noMid;
        const buyer = traderIds[(index + n) % traderIds.length] as string;
        const seller = makers[n % makers.length] as string;
        if (buyer === seller) continue;
        const price = clampPrice(mid + (n % 2 === 0 ? 1 : -1));
        const quantity = 20 + ((n * 13 + index * 7) % 45);
        fillTrade(
          marketId,
          outcome,
          price,
          quantity,
          buyer,
          seller,
          new Date(createdAt.getTime() + (n + 1) * 3_600_000),
        );
      }
    }

    markets.push(state);

    if (spec.status === "RESOLVED" && spec.outcome) {
      settle(state, spec.outcome, day(spec.closesInDays + 1));
    }
    if (spec.status === "REFUND") {
      settle(state, "REFUND", day(spec.closesInDays + 1));
    }
  }

  userRows.forEach((row) => {
    const owner = accounts.get(row.id as string);
    if (!owner) return;
    row.balance = owner.balance;
    row.reservedBalance = owner.reservedBalance;
  });

  const positionRows: (typeof positionsTable.$inferInsert)[] = positions.map((position) => ({
    id: position.id,
    userId: position.userId,
    marketId: position.marketId,
    outcome: position.outcome,
    quantity: position.quantity,
    reservedQuantity: position.reservedQuantity,
    avgPrice: position.avgPrice,
    settledAt: position.settledAt,
    createdAt: position.createdAt,
  }));

  const marketRows: (typeof marketsTable.$inferInsert)[] = markets.map((state) => ({
    id: state.id,
    question: state.question,
    description: state.description,
    status: state.status,
    outcome: state.outcome,
    resolvedBy: state.resolvedBy,
    resolvedAt: state.resolvedAt,
    closesAt: state.closesAt,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  }));

  await db.transaction(async (tx) => {
    await tx.insert(usersTable).values(userRows);
    await tx.insert(marketsTable).values(marketRows);
    if (orders.length > 0) await tx.insert(ordersTable).values(orders);
    if (trades.length > 0) await tx.insert(tradesTable).values(trades);
    if (positionRows.length > 0) await tx.insert(positionsTable).values(positionRows);
    if (ledger.length > 0) await tx.insert(ledgerTable).values(ledger);
  });

  const openBooks = markets.filter((state) => state.status === "OPEN").length;
  console.log(
    [
      "seeded",
      `${userRows.length} users`,
      `${marketRows.length} markets (${openBooks} open)`,
      `${orders.length} orders`,
      `${trades.length} trades`,
      `${positionRows.length} positions`,
      `${ledger.length} ledger entries`,
    ].join(" · "),
  );
  console.log(`admin: ${ADMIN.username} <${ADMIN.email}>`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
