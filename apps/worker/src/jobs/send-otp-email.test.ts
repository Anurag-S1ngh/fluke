import { describe, expect, mock, test } from "bun:test";
import type { Job } from "bullmq";

import type { SendOtpEmailPayload } from "@fluke/queue";

import { createSendOtpEmailProcessor } from "./send-otp-email";

const payload: SendOtpEmailPayload = {
  version: 1,
  email: "reader@test.fluke",
  otp: "123456",
  purpose: "signup",
};

const makeJob = (data: unknown, attemptsMade = 0, attempts = 5) =>
  ({ data, attemptsMade, opts: { attempts } }) as unknown as Job<SendOtpEmailPayload>;

describe("sendOtpEmail processor", () => {
  test("sends the message and returns the provider id", async () => {
    const send = mock(async () => ({ id: "email_1" }));
    const clearOtp = mock(async () => {});
    const process = createSendOtpEmailProcessor({ send, clearOtp });

    const result = await process(makeJob(payload));

    expect(result).toEqual({ id: "email_1" });
    expect(send).toHaveBeenCalledTimes(1);
    expect(clearOtp).toHaveBeenCalledTimes(0);
  });

  test("keeps the OTP when a retry remains", async () => {
    const send = mock(async () => {
      throw new Error("smtp down");
    });
    const clearOtp = mock(async () => {});
    const process = createSendOtpEmailProcessor({ send, clearOtp });

    await expect(process(makeJob(payload, 0, 5))).rejects.toThrow("smtp down");

    expect(clearOtp).toHaveBeenCalledTimes(0);
  });

  test("clears the OTP after the final failed attempt", async () => {
    const send = mock(async () => {
      throw new Error("smtp down");
    });
    const clearOtp = mock(async () => {});
    const process = createSendOtpEmailProcessor({ send, clearOtp });

    await expect(process(makeJob(payload, 4, 5))).rejects.toThrow("smtp down");

    expect(clearOtp).toHaveBeenCalledWith(payload.email, payload.otp);
  });

  test("rejects malformed job data", async () => {
    const send = mock(async () => ({ id: "email_1" }));
    const clearOtp = mock(async () => {});
    const process = createSendOtpEmailProcessor({ send, clearOtp });

    await expect(
      process(makeJob({ version: 1, email: "not-an-email", otp: "12", purpose: "signup" })),
    ).rejects.toThrow();

    expect(send).toHaveBeenCalledTimes(0);
  });
});
