import type { NextFunction, Request, Response } from "express";
import { db } from "@/services";
import { usersTable } from "@fluke/db/schema/index";
import { eq } from "drizzle-orm";
import { verifySessionToken } from "@/util/jwt";

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const token = (req.cookies?.session as string | undefined) ?? undefined;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = await verifySessionToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user || user.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  req.userId = userId;
  return next();
};
