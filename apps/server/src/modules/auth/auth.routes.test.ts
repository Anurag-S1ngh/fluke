import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { db } from "@/services";
import { usersTable } from "@fluke/db/schema/index";
import { assertTestDatabase, resetDatabase } from "@/test/db";
import { startServer } from "@/test/http";
import { SESSION_COOKIE, signSessionToken } from "@/util/jwt";

let server: Awaited<ReturnType<typeof startServer>>;

beforeAll(async () => {
  assertTestDatabase();
  server = await startServer();
});

afterAll(async () => {
  await server.close();
});

beforeEach(resetDatabase);

let seq = 0;
const next = () => {
  seq += 1;
  return seq;
};

const createUser = async (role: "USER" | "ADMIN" = "USER") => {
  const n = next();
  const [user] = await db
    .insert(usersTable)
    .values({ username: `auth_routes_${n}`, email: `auth_routes_${n}@test.fluke`, role })
    .returning();
  if (!user) throw new Error("fixture failed: user");
  return user;
};

const headers = async (userId?: string, json = false) => {
  const token = userId ? await signSessionToken(userId) : null;
  return {
    ...(json ? { "content-type": "application/json" } : {}),
    ...(token ? { cookie: `${SESSION_COOKIE}=${token}` } : {}),
  };
};

const request = async (
  path: string,
  options: { method?: string; userId?: string; body?: unknown } = {},
) =>
  fetch(`${server.baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: await headers(options.userId, options.body !== undefined),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

describe("GET /auth/me", () => {
  test("requires a session", async () => {
    const res = await request("/auth/me");

    expect(res.status).toBe(401);
  });

  test("rejects an invalid session token", async () => {
    const res = await fetch(`${server.baseUrl}/auth/me`, {
      headers: { cookie: `${SESSION_COOKIE}=not-a-token` },
    });

    expect(res.status).toBe(401);
  });

  test("returns the current user and role", async () => {
    const admin = await createUser("ADMIN");

    const res = await request("/auth/me", { userId: admin.id });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: admin.id, role: "ADMIN" });
  });
});

describe("POST /auth/signout", () => {
  test("clears the session cookie", async () => {
    const user = await createUser();

    const res = await request("/auth/signout", { method: "POST", userId: user.id });

    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Expires=Thu, 01 Jan 1970");
  });
});

describe("protected routes", () => {
  test("positions require a session", async () => {
    const res = await request("/positions");

    expect(res.status).toBe(401);
  });

  test("creating a market requires admin", async () => {
    const user = await createUser();
    const body = {
      question: "Will the route guard hold?",
      description: "A description long enough to pass validation.",
      closesAt: new Date(Date.now() + 86_400_000).toISOString(),
    };

    const anonymous = await request("/markets", { method: "POST", body });
    const regular = await request("/markets", { method: "POST", userId: user.id, body });

    expect(anonymous.status).toBe(401);
    expect(regular.status).toBe(403);
  });

  test("admins can create a draft market", async () => {
    const admin = await createUser("ADMIN");
    const body = {
      question: "Will the admin desk create this?",
      description: "A description long enough to pass validation.",
      closesAt: new Date(Date.now() + 86_400_000).toISOString(),
    };

    const res = await request("/markets", { method: "POST", userId: admin.id, body });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ market: { status: "DRAFT" } });
  });
});
