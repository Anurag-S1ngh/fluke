import type { Request, Response } from "express";
import { z } from "zod";
import { ENV } from "@/env.server";
import { AppError } from "@/types/error";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS, signSessionToken } from "@/util/jwt";
import * as service from "./auth.service";
import { SigninSchema, SignupSchema, VerifySchema } from "./auth.validation";

const sendError = (res: Response, err: unknown) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: err.issues });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  return res.status(500).json({ error: "Internal server error" });
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email } = SignupSchema.parse(req.body);
    await service.signup(username, email);
    return res.status(201).json({ message: "OTP sent to email" });
  } catch (err) {
    return sendError(res, err);
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email } = SigninSchema.parse(req.body);
    await service.signin(email);
    return res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    return sendError(res, err);
  }
};

export const verify = async (req: Request, res: Response) => {
  try {
    const { email, otp } = VerifySchema.parse(req.body);
    const { user } = await service.verify(email, otp);
    const token = await signSessionToken(user.id);
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS,
      path: "/",
    });
    return res.status(200).json({ message: "verified", user });
  } catch (err) {
    return sendError(res, err);
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await service.me(req.userId);
    return res.status(200).json(user);
  } catch (err) {
    return sendError(res, err);
  }
};

export const signout = async (_req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: ENV.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return res.status(200).json({ message: "signed out" });
};
