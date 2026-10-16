import type { Request, Response } from "express";
import { sendError } from "@/util/respond";
import * as service from "./market.service";
import {
  CreateMarketSchema,
  ListMarketsQuery,
  MarketIdParam,
  ResolveMarketSchema,
} from "./market.validation";

export const list = async (req: Request, res: Response) => {
  try {
    const { status } = ListMarketsQuery.parse(req.query);
    const markets = await service.listMarkets(status);
    return res.status(200).json({ markets });
  } catch (err) {
    return sendError(res, err);
  }
};

export const detail = async (req: Request, res: Response) => {
  try {
    const { marketId } = MarketIdParam.parse(req.params);
    const market = await service.getMarketById(marketId);
    return res.status(200).json({ market });
  } catch (err) {
    return sendError(res, err);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const input = CreateMarketSchema.parse(req.body);
    const market = await service.createMarket(input);
    return res.status(201).json({ market });
  } catch (err) {
    return sendError(res, err);
  }
};

export const publish = async (req: Request, res: Response) => {
  try {
    const { marketId } = MarketIdParam.parse(req.params);
    const market = await service.publishMarket(marketId);
    return res.status(200).json({ market });
  } catch (err) {
    return sendError(res, err);
  }
};

export const close = async (req: Request, res: Response) => {
  try {
    const { marketId } = MarketIdParam.parse(req.params);
    const market = await service.closeMarket(marketId);
    return res.status(200).json({ market });
  } catch (err) {
    return sendError(res, err);
  }
};

export const resolve = async (req: Request, res: Response) => {
  try {
    const { marketId } = MarketIdParam.parse(req.params);
    const input = ResolveMarketSchema.parse(req.body);
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const market = await service.resolveMarket(marketId, input, req.userId);
    return res.status(200).json({ market });
  } catch (err) {
    return sendError(res, err);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { marketId } = MarketIdParam.parse(req.params);
    await service.deleteMarket(marketId);
    return res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
};
