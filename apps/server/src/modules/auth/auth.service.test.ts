import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, redis } from "@/services";
import { AppError } from "@/types/error";
import { get, set } from "@fluke/redis";
import { ledgerTable, usersTable } from "@fluke/db/schema/index";
import { assertTestDatabase, resetDatabase } from "@/test/db";
import { DAILY_GRANT_AMOUNT, me, signin, signup, startOfTodayUTC, verify } from "./auth.service";

let emailShouldFail = false;
mock.module("@fluke/email", () => ({
  // Hoisted: services.ts also imports this package at load, so the factory
  // must stub createEmailClient too. The stub client is only ever passed
  // back into the mocked sendOtpEmail, which ignores it.
  createEmailClient: () => ({}),
  default: () => ({}),
  sendOtpEmail: mock(async () => {
    if (emailShouldFail) {
      throw new Error("smtp down");
    }
    return { id: "test-email-id" };
  }),
}));

beforeAll(assertTestDatabase);
beforeEach(async () => {
  emailShouldFail = false;
  await resetDatabase();
  const keys = await redis.keys("otp:*");
  if (keys.length > 0) {
    await redis.del(...keys);
  }
});

let seq = 0;
const nextIdentity = () => {
  seq += 1;
  return { username: `authuser_${seq}`, email: `authuser_${seq}@test.fluke` };
};

const readOtp = async (email: string) => {
  const value = await get(redis, `otp:${email}`);
  if (!value) throw new Error("fixture failed: otp missing");
  return (JSON.parse(value) as { username?: string; otp: string }).otp;
};

const userRow = async (email: string) => {
  const [row] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  return row;
};

const ledgerFor = (userId: string) =>
  db.select().from(ledgerTable).where(eq(ledgerTable.userId, userId));

describe("signup", () => {
  test("happy path stores OTP with TTL and sends email, creates no user", async () => {
    const { username, email } = nextIdentity();

    await signup(username, email);

    const stored = await get(redis, `otp:${email}`);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toMatchObject({ username });
    const ttl = await redis.ttl(`otp:${email}`);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(300);
    expect(await userRow(email)).toBeUndefined();
  });

  test("duplicate email throws 400 and writes no OTP", async () => {
    const { email } = nextIdentity();
    await db.insert(usersTable).values({ username: "taken", email, balance: 0 });

    const err = await signup("freshname", email).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
    expect(await get(redis, `otp:${email}`)).toBeNull();
  });

  test("duplicate username throws 400 and writes no OTP", async () => {
    const { username, email } = nextIdentity();
    await db.insert(usersTable).values({ username, email, balance: 0 });
    const otherEmail = `other_${email}`;

    const err = await signup(username, otherEmail).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
    expect(await get(redis, `otp:${otherEmail}`)).toBeNull();
  });

  test("email failure throws 500 and rolls back the OTP", async () => {
    const { username, email } = nextIdentity();
    emailShouldFail = true;

    const err = await signup(username, email).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 500 });
    expect(await get(redis, `otp:${email}`)).toBeNull();
  });
});

describe("verify", () => {
  test("correct OTP creates user with daily grant and clears the key", async () => {
    const { username, email } = nextIdentity();
    await signup(username, email);

    const { user } = await verify(email, await readOtp(email));

    expect(user.username).toBe(username);
    expect(user.email).toBe(email);
    expect(user.balance).toBe(DAILY_GRANT_AMOUNT);
    const row = await userRow(email);
    expect(row?.lastDailyGrantAt).not.toBeNull();
    const rows = await ledgerFor(user.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      type: "DAILY_GRANT",
      amount: DAILY_GRANT_AMOUNT,
      entryDirection: "CREDIT",
    });
    expect(await get(redis, `otp:${email}`)).toBeNull();
  });

  test("wrong OTP throws 400 and creates no user", async () => {
    const { username, email } = nextIdentity();
    await signup(username, email);
    const realOtp = await readOtp(email);
    const wrongOtp = realOtp[0] === "0" ? `1${realOtp.slice(1)}` : `0${realOtp.slice(1)}`;

    const err = await verify(email, wrongOtp).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
    expect(await userRow(email)).toBeUndefined();
  });

  test("missing OTP key throws 400", async () => {
    const err = await verify("nobody@test.fluke", "123456").catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
  });

  test("malformed OTP payload throws 400", async () => {
    const { email } = nextIdentity();
    await set(redis, `otp:${email}`, "not-json{{{", 300);

    const err = await verify(email, "123456").catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
  });
});

describe("signin and daily grant", () => {
  test("signin stores keyless OTP for an existing user", async () => {
    const { username, email } = nextIdentity();
    await signup(username, email);
    await verify(email, await readOtp(email));

    await signin(email);

    const value = await get(redis, `otp:${email}`);
    expect(value).not.toBeNull();
    expect(JSON.parse(value as string).username).toBeUndefined();
  });

  test("signin unknown email throws 400", async () => {
    const err = await signin("ghost@test.fluke").catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
  });

  test("first verify of the day grants, second verify grants nothing", async () => {
    const { username, email } = nextIdentity();
    await signup(username, email);
    const { user } = await verify(email, await readOtp(email));
    await db
      .update(usersTable)
      .set({ lastDailyGrantAt: new Date(Date.now() - 25 * 3_600_000) })
      .where(eq(usersTable.id, user.id));

    await signin(email);
    const before = (await userRow(email))?.balance ?? 0;
    const first = await verify(email, await readOtp(email));
    expect(first.user.balance).toBe(before + DAILY_GRANT_AMOUNT);

    await signin(email);
    const second = await verify(email, await readOtp(email));
    expect(second.user.balance).toBe(before + DAILY_GRANT_AMOUNT);
    expect(await ledgerFor(user.id)).toHaveLength(2);
  });
});

describe("me", () => {
  test("returns the user row", async () => {
    const { username, email } = nextIdentity();
    await signup(username, email);
    const { user } = await verify(email, await readOtp(email));

    const found = await me(user.id);

    expect(found).toMatchObject({
      id: user.id,
      username,
      email,
    });
  });

  test("unknown id throws 400", async () => {
    const err = await me(randomUUID()).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
  });
});

describe("startOfTodayUTC", () => {
  test("midnight maps to itself, other times map to 00:00 UTC", () => {
    expect(startOfTodayUTC(new Date("2026-10-20T00:00:00.000Z"))).toEqual(
      new Date("2026-10-20T00:00:00.000Z"),
    );
    expect(startOfTodayUTC(new Date("2026-10-20T23:59:59.999Z"))).toEqual(
      new Date("2026-10-20T00:00:00.000Z"),
    );
  });
});
