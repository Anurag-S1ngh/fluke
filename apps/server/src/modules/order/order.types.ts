import type { outcomeEnum, sideEnum } from "@fluke/db/schema/enums";

export type OrderSide = (typeof sideEnum.enumValues)[number];
export type OrderOutcome = (typeof outcomeEnum.enumValues)[number];

export interface PlaceOrderInput {
  marketId: string;
  side: OrderSide;
  outcome: OrderOutcome;
  price: number;
  quantity: number;
}
