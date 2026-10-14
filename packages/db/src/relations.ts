import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  usersTable: {
    orders: r.many.ordersTable({
      from: r.usersTable.id,
      to: r.ordersTable.userId,
    }),
    positions: r.many.positionsTable({
      from: r.usersTable.id,
      to: r.positionsTable.userId,
    }),
    ledgerEntries: r.many.ledgerTable({
      from: r.usersTable.id,
      to: r.ledgerTable.userId,
    }),
    resolvedMarkets: r.many.marketsTable({
      from: r.usersTable.id,
      to: r.marketsTable.resolvedBy,
    }),
  },
  marketsTable: {
    resolver: r.one.usersTable({
      from: r.marketsTable.resolvedBy,
      to: r.usersTable.id,
    }),
    orders: r.many.ordersTable({
      from: r.marketsTable.id,
      to: r.ordersTable.marketId,
    }),
    trades: r.many.tradesTable({
      from: r.marketsTable.id,
      to: r.tradesTable.marketId,
    }),
    positions: r.many.positionsTable({
      from: r.marketsTable.id,
      to: r.positionsTable.marketId,
    }),
  },
  ordersTable: {
    user: r.one.usersTable({ from: r.ordersTable.userId, to: r.usersTable.id }),
    market: r.one.marketsTable({
      from: r.ordersTable.marketId,
      to: r.marketsTable.id,
    }),
    askTrades: r.many.tradesTable({
      from: r.ordersTable.id,
      to: r.tradesTable.askOrderId,
    }),
    bidTrades: r.many.tradesTable({
      from: r.ordersTable.id,
      to: r.tradesTable.bidOrderId,
    }),
  },
  tradesTable: {
    askOrder: r.one.ordersTable({
      from: r.tradesTable.askOrderId,
      to: r.ordersTable.id,
    }),
    bidOrder: r.one.ordersTable({
      from: r.tradesTable.bidOrderId,
      to: r.ordersTable.id,
    }),
    market: r.one.marketsTable({
      from: r.tradesTable.marketId,
      to: r.marketsTable.id,
    }),
  },
  positionsTable: {
    user: r.one.usersTable({ from: r.positionsTable.userId, to: r.usersTable.id }),
    market: r.one.marketsTable({
      from: r.positionsTable.marketId,
      to: r.marketsTable.id,
    }),
  },
  ledgerTable: {
    user: r.one.usersTable({ from: r.ledgerTable.userId, to: r.usersTable.id }),
  },
}));
