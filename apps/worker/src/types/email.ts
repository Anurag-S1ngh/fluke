import type { SendOtpEmailPayload } from "@fluke/queue";

export type SendOtpEmailResult = {
  id: string;
};

export type SendOtpEmailDeps = {
  send: (payload: SendOtpEmailPayload) => Promise<SendOtpEmailResult>;
};
