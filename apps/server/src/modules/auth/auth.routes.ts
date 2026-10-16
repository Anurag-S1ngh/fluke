import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { me, signin, signout, signup, verify } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.post("/verify", verify);
authRouter.post("/signout", signout);
authRouter.get("/me", requireAuth, me);
