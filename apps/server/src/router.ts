import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { marketRouter } from "./modules/market/market.routes";
import { orderRouter } from "./modules/order/order.routes";
import { positionRouter } from "./modules/position/position.routes";

export const router = Router();

router.use("/auth", authRouter);
router.use("/markets", marketRouter);
router.use("/orders", orderRouter);
router.use("/positions", positionRouter);
