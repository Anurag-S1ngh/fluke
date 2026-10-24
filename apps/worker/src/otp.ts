import { del, get } from "@fluke/redis";
import { redis } from "./services";

/**
 * Remove an OTP only if it still matches the one this job tried to deliver.
 * A newer OTP may have replaced it while the job was retrying.
 */
export const clearOtpIfCurrent = async (email: string, otp: string) => {
  const key = `otp:${email}`;
  const stored = await get(redis, key);
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored) as { otp?: unknown };
    if (parsed.otp !== otp) return;
  } catch {
    return;
  }

  await del(redis, key);
};
