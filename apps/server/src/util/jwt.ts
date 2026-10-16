import { jwtVerify, SignJWT } from "jose";

import { ENV } from "@/env.server";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const signSessionToken = (userId: string): Promise<string> =>
  new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(ENV.JWT_SECRET));

export const verifySessionToken = async (token: string): Promise<string | null> => {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(ENV.JWT_SECRET));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
};
