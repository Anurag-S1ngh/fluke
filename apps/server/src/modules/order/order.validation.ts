import { z } from "zod";

export const PlaceOrderSchema = z.object({
  marketId: z.uuid("invalid market id"),
  side: z.enum(["BID", "ASK"], "side must be BID or ASK"),
  outcome: z.enum(["YES", "NO"], "outcome must be YES or NO"),
  price: z
    .number("price must be a number")
    .int("price must be an integer")
    .min(1, "price must be at least 1"),
  quantity: z
    .number("quantity must be a number")
    .int("quantity must be an integer")
    .min(1, "quantity must be at least 1"),
});

export const OrderIdParam = z.object({
  orderId: z.uuid("invalid order id"),
});

export const ListOrdersQuery = z.object({
  marketId: z.uuid("invalid market id").optional(),
});

export const BookQuery = z.object({
  marketId: z.uuid("invalid market id"),
  depth: z.coerce.number().int().min(1).max(50).default(20),
});
