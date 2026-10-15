export const OTP_SUBJECT = "Your verification code";

export function buildOtpHtml(otp: string, expiresInMinutes: number): string {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#111">
<h2>Your verification code</h2>
<p>Your code is <strong style="font-size:24px;letter-spacing:4px">${otp}</strong>.</p>
<p>It expires in ${expiresInMinutes} minutes. If you didn't request this, ignore this email.</p>
</body></html>`;
}
