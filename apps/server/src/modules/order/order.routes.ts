import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import * as controller from "./order.controller";

export const orderRouter = Router();

orderRouter.get("/", requireAuth, controller.listMine);
orderRouter.get("/book", controller.book);
orderRouter.post("/", requireAuth, controller.place);
orderRouter.delete("/:orderId", requireAuth, controller.cancel);
