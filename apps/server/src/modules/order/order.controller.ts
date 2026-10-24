import type { Request, Response } from "express";
import { sendError } from "@/util/respond";
import * as service from "./order.service";
import { BookQuery, ListOrdersQuery, OrderIdParam, PlaceOrderSchema } from "./order.validation";

export const place = async (req: Request, res: Response) => {
  try {
    const input = PlaceOrderSchema.parse(req.body);
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const order = await service.placeOrder(req.userId, input);
    return res.status(201).json({ order });
  } catch (err) {
    return sendError(res, err);
  }
};

export const cancel = async (req: Request, res: Response) => {
  try {
    const { orderId } = OrderIdParam.parse(req.params);
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const order = await service.cancelOrder(req.userId, orderId);
    return res.status(200).json({ order });
  } catch (err) {
    return sendError(res, err);
  }
};

export const listMine = async (req: Request, res: Response) => {
  try {
    const { marketId } = ListOrdersQuery.parse(req.query);
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const orders = await service.listMyOrders(req.userId, marketId);
    return res.status(200).json({ orders });
  } catch (err) {
    return sendError(res, err);
  }
};

export const book = async (req: Request, res: Response) => {
  try {
    const { marketId, depth } = BookQuery.parse(req.query);
    const orders = await service.getOrderBook(marketId, depth);
    return res.status(200).json({ book: orders });
  } catch (err) {
    return sendError(res, err);
  }
};
