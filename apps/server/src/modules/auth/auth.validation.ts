import { z } from "zod";

export const SignupSchema = z.object({
  email: z.email("invalid email"),
  username: z
    .string("invalid username")
    .min(3, "username must be at least 3 characters")
    .max(20, "username must be at most 20 characters"),
});

export const SigninSchema = z.object({
  email: z.email("invalid email"),
});

export const VerifySchema = z.object({
  email: z.email("invalid email"),
  otp: z.string("invalid otp").min(4).max(10),
});
