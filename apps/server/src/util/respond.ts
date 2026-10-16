import type { Response } from "express";
import { z } from "zod";

import { AppError } from "@/types/error";

export const sendError = (res: Response, err: unknown) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message || "invalid input" });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  return res.status(500).json({ error: "Internal server error" });
};
