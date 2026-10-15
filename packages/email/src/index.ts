import { Resend } from "resend";

import type { EmailConfig } from "./config";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export function createEmailClient(env: EmailConfig) {
  const resend = new Resend(env.RESEND_API_KEY);
  return {
    env,
    send: async (options: SendEmailOptions): Promise<{ id: string }> => {
      const { data, error } = await resend.emails.send({
        from: options.from ?? env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      if (error || !data) {
        throw new Error(error?.message ?? "Failed to send email");
      }
      return { id: data.id };
    },
  };
}

export async function sendOtpEmail(
  client: ReturnType<typeof createEmailClient>,
  to: string,
  otp: string,
  expiresInMinutes = 5,
): Promise<{ id: string }> {
  const subject = "Your verification code";
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#111">
<h2>Your verification code</h2>
<p>Your code is <strong style="font-size:24px;letter-spacing:4px">${otp}</strong>.</p>
<p>It expires in ${expiresInMinutes} minutes. If you didn't request this, ignore this email.</p>
</body></html>`;
  const text = `Your verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`;
  return client.send({ to, subject, html, text });
}

export type EmailClient = ReturnType<typeof createEmailClient>;
export type { EmailConfig } from "./config";
export default createEmailClient;
