import type { MarketStatus, OrderStatus } from "./types";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatMoney = (cents: number) => money.format(cents / 100);

export const formatPrice = (cents: number) => `${cents}¢`;

export const formatDate = (iso: string) => shortDate.format(new Date(iso));

export const formatDateTime = (iso: string) => longDate.format(new Date(iso));

export const marketStatusLabel: Record<MarketStatus, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  CLOSED: "Closed",
  RESOLVED: "Resolved",
  REFUND: "Refunded",
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  OPEN: "Open",
  PARTIALLY_FILLED: "Partial",
  FILLED: "Filled",
  CANCELLED: "Cancelled",
};
