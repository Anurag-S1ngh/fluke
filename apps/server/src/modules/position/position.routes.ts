import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { listMine } from "./position.controller";

export const positionRouter = Router();

positionRouter.get("/", requireAuth, listMine);
