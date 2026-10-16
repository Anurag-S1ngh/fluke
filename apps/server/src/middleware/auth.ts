import type { NextFunction, Request, Response } from "express";

import { verifySessionToken } from "@/util/jwt";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = (req.cookies?.session as string | undefined) ?? undefined;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = await verifySessionToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  return next();
};
