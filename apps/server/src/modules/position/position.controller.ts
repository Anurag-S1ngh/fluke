import type { Request, Response } from "express";
import { sendError } from "@/util/respond";
import * as service from "./position.service";

export const listMine = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const positions = await service.listPositions(req.userId);
    return res.status(200).json({ positions });
  } catch (err) {
    return sendError(res, err);
  }
};
