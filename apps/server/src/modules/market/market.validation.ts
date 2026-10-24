import { z } from "zod";
import { HISTORY_RANGES } from "./market.types";

export const MarketStatusSchema = z.enum(["DRAFT", "OPEN", "CLOSED", "RESOLVED", "REFUND"]);

export const CreateMarketSchema = z.object({
  question: z.string().min(10, "question must be at least 10 characters"),
  description: z.string().min(20, "description must be at least 20 characters"),
  closesAt: z.coerce
    .date()
    .refine((d) => d.getTime() > Date.now(), "closesAt must be in the future"),
  publish: z.boolean().optional(),
});

export const MarketIdParam = z.object({
  marketId: z.uuid("invalid market id"),
});

export const ListMarketsQuery = z.object({
  status: MarketStatusSchema.optional(),
});

export const HistoryQuery = z.object({
  range: z.enum(HISTORY_RANGES).default("ALL"),
});

export const ResolveMarketSchema = z
  .object({
    outcome: z.enum(["YES", "NO"]).optional(),
    refund: z.boolean().optional(),
  })
  .refine(
    (v) => (v.refund === true && v.outcome === undefined) || (v.refund !== true && !!v.outcome),
    "provide either outcome (YES|NO) or refund: true",
  );
