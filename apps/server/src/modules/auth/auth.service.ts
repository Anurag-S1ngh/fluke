import { ENV } from "@/env.server";
import { db, redis, resend } from "@/services";
import { AppError } from "@/types/error";
import { generateOTP } from "@/util/generate-otp";
import { usersTable } from "@fluke/db/schema/index";
import { sendOtpEmail } from "@fluke/email";
import { del, get, set } from "@fluke/redis";
import { eq } from "drizzle-orm";
import type { AuthUser, OTPPayload } from "./auth.types";

export const signup = async (username: string, email: string) => {
  const [[byEmail], [byUsername]] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1),
    db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1),
  ]);
  if (byEmail) {
    throw new AppError("user with this email already exists", 400);
  }
  if (byUsername) {
    throw new AppError("Username already exists", 400);
  }

  const otp = generateOTP();
  const key = "otp:" + email;
  const value = JSON.stringify({ username, otp });
  await set(redis, key, value, 300);
  try {
    await sendOtpEmail(resend, ENV, email, otp);
  } catch {
    await del(redis, key);
    throw new AppError("Failed to send email", 500);
  }
};

export const verify = async (email: string, userOTP: string): Promise<{ user: AuthUser }> => {
  const key = "otp:" + email;
  const value = await get(redis, key);
  if (!value) {
    throw new AppError("Invalid OTP", 400);
  }
  let payload: OTPPayload;
  try {
    payload = JSON.parse(value) as OTPPayload;
  } catch {
    throw new AppError("Invalid OTP", 400);
  }
  const { username, otp } = payload;
  if (otp !== userOTP) {
    throw new AppError("Invalid OTP", 400);
  }
  let user: AuthUser | undefined;
  if (username) {
    const [created] = await db.insert(usersTable).values({ username, email }).returning({
      id: usersTable.id,
      email: usersTable.email,
      username: usersTable.username,
      balance: usersTable.balance,
    });
    user = created;
  } else {
    const [existing] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        username: usersTable.username,
        balance: usersTable.balance,
      })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    user = existing;
  }
  if (!user) {
    throw new AppError("user does not exist", 400);
  }
  await del(redis, key);
  return { user };
};

export const signin = async (email: string) => {
  const [byEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!byEmail) {
    throw new AppError("user does not exist", 400);
  }
  const otp = generateOTP();
  const key = "otp:" + email;
  const value = JSON.stringify({ otp });
  await set(redis, key, value, 300);
  try {
    await sendOtpEmail(resend, ENV, email, otp);
  } catch {
    await del(redis, key);
    throw new AppError("Failed to send email", 500);
  }
};

export const me = async (userId: string) => {
  const [user] = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      balance: usersTable.balance,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    throw new AppError("user does not exist", 400);
  }
  return user;
};
