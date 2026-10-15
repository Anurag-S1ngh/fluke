import { Resend } from "resend";
import type { EmailConfig } from "./config";
import type { Resend as ResendInstance } from "resend";
import { OTP_SUBJECT, buildOtpHtml } from "./emails/otp";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export function createEmailClient(env: EmailConfig): ResendInstance {
  return new Resend(env.RESEND_API_KEY);
}

export async function send(
  client: ResendInstance,
  env: EmailConfig,
  options: SendEmailOptions,
): Promise<{ id: string }> {
  const { data, error } = await client.emails.send({
    from: options.from ?? env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to send email");
  }
  return { id: data.id };
}

export async function sendOtpEmail(
  client: ResendInstance,
  env: EmailConfig,
  to: string,
  otp: string,
  expiresInMinutes = 5,
): Promise<{ id: string }> {
  return send(client, env, {
    to,
    subject: OTP_SUBJECT,
    html: buildOtpHtml(otp, expiresInMinutes),
  });
}

export type EmailClient = ResendInstance;
export type { EmailConfig } from "./config";

export default createEmailClient;
