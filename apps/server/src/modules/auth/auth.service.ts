import { ENV } from "@/env.server";
import { db, redis, resend } from "@/services";
import { AppError } from "@/types/error";
import { generateOTP } from "@/util/generate-otp";
import { ledgerTable, usersTable } from "@fluke/db/schema/index";
import { sendOtpEmail } from "@fluke/email";
import { del, get, set } from "@fluke/redis";
import { eq, sql } from "drizzle-orm";
import type { AuthUser, OTPPayload } from "./auth.types";

export const DAILY_GRANT_AMOUNT = 100000; // $1000.00 in cents

export const startOfTodayUTC = (now: Date = new Date()) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

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
    const now = new Date();
    user = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(usersTable)
        .values({
          username,
          email,
          balance: DAILY_GRANT_AMOUNT,
          lastDailyGrantAt: now,
        })
        .returning({
          id: usersTable.id,
          email: usersTable.email,
          username: usersTable.username,
          balance: usersTable.balance,
          role: usersTable.role,
        });
      if (!created) {
        throw new AppError("failed to create user", 500);
      }
      await tx.insert(ledgerTable).values({
        type: "DAILY_GRANT",
        userId: created.id,
        amount: DAILY_GRANT_AMOUNT,
        entryDirection: "CREDIT",
      });
      return created;
    });
  } else {
    const now = new Date();
    const todayStart = startOfTodayUTC(now);
    user = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1)
        .for("update");
      if (!existing) {
        throw new AppError("user does not exist", 400);
      }
      if (!existing.lastDailyGrantAt || existing.lastDailyGrantAt < todayStart) {
        const [updated] = await tx
          .update(usersTable)
          .set({
            balance: sql`${usersTable.balance} + ${DAILY_GRANT_AMOUNT}`,
            lastDailyGrantAt: now,
            updatedAt: now,
          })
          .where(eq(usersTable.id, existing.id))
          .returning({
            id: usersTable.id,
            email: usersTable.email,
            username: usersTable.username,
            balance: usersTable.balance,
            role: usersTable.role,
          });
        if (!updated) {
          throw new AppError("user does not exist", 400);
        }
        await tx.insert(ledgerTable).values({
          type: "DAILY_GRANT",
          userId: existing.id,
          amount: DAILY_GRANT_AMOUNT,
          entryDirection: "CREDIT",
        });
        return updated;
      }
      return {
        id: existing.id,
        email: existing.email,
        username: existing.username,
        balance: existing.balance,
        role: existing.role,
      };
    });
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

export const me = async (userId: string): Promise<AuthUser> => {
  const [user] = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      balance: usersTable.balance,
      role: usersTable.role,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    throw new AppError("user does not exist", 400);
  }
  return user;
};
