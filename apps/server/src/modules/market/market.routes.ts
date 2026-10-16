import { Router } from "express";
import { requireAdmin } from "@/middleware/admin";
import * as controller from "./market.controller";

export const marketRouter = Router();

marketRouter.get("/", controller.list);
marketRouter.get("/:marketId", controller.detail);
marketRouter.post("/", requireAdmin, controller.create);
marketRouter.patch("/:marketId/publish", requireAdmin, controller.publish);
marketRouter.patch("/:marketId/close", requireAdmin, controller.close);
marketRouter.patch("/:marketId/resolve", requireAdmin, controller.resolve);
marketRouter.delete("/:marketId", requireAdmin, controller.remove);
