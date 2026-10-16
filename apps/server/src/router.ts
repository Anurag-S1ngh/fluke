import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { marketRouter } from "./modules/market/market.routes";

export const router = Router();

router.use("/auth", authRouter);
router.use("/markets", marketRouter);
