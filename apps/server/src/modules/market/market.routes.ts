import { Router } from "express";
import { requireAdmin } from "@/middleware/admin";
import { optionalAuth } from "@/middleware/auth";
import * as controller from "./market.controller";

export const marketRouter = Router();

marketRouter.get("/", optionalAuth, controller.list);
marketRouter.get("/:marketId", optionalAuth, controller.detail);
marketRouter.get("/:marketId/history", optionalAuth, controller.history);
marketRouter.post("/", requireAdmin, controller.create);
marketRouter.patch("/:marketId/publish", requireAdmin, controller.publish);
marketRouter.patch("/:marketId/close", requireAdmin, controller.close);
marketRouter.patch("/:marketId/resolve", requireAdmin, controller.resolve);
marketRouter.delete("/:marketId", requireAdmin, controller.remove);
