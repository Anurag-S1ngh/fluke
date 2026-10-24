export interface OTPPayload {
  username?: string;
  otp: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  balance: number;
  role: "ADMIN" | "USER";
}
