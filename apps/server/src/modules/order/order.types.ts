import type { db } from "@/services";
import type { outcomeEnum, sideEnum } from "@fluke/db/schema/enums";
import type { ordersTable } from "@fluke/db/schema/index";

export type OrderTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type OrderRow = typeof ordersTable.$inferSelect;

export type OrderSide = (typeof sideEnum.enumValues)[number];
export type OrderOutcome = (typeof outcomeEnum.enumValues)[number];

export interface PlaceOrderInput {
  marketId: string;
  side: OrderSide;
  outcome: OrderOutcome;
  price: number;
  quantity: number;
}
