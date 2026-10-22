"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { AuthError, AuthShell } from "@/components/auth-shell";
import { Field, inputClass, primaryAction, textAction } from "@/components/ui-bits";
import { api } from "@/lib/api";

export function SignInForm({ next }: { next?: string }) {
  const [step, setStep] = React.useState<"email" | "code">("email");
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { refresh } = useAuth();
  const router = useRouter();

  const target =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/signin") &&
    !next.startsWith("/signup")
      ? next
      : "/markets";

  const sendCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/auth/signin", { method: "POST", body: JSON.stringify({ email }) });
      setStep("code");
      toast.success("Code sent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError(null);
    try {
      await api("/auth/signin", { method: "POST", body: JSON.stringify({ email }) });
      toast.success("A new code is on its way.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/auth/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      await refresh();
      toast.success("Signed in.");
      router.push(target as Route);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the code.");
    } finally {
      setBusy(false);
    }
  };

  if (step === "code") {
    return (
      <AuthShell
        title="Check your inbox."
        description={`We sent a six-digit code to ${email}. It expires in five minutes.`}
      >
        <form onSubmit={verify} className="space-y-4">
          <Field label="Code" hint="6 digits">
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={`${inputClass} text-center font-mono text-xl tracking-[0.4em]`}
            />
          </Field>

          {error ? <AuthError>{error}</AuthError> : null}

          <button
            type="submit"
            disabled={busy || otp.length !== 6}
            className={`${primaryAction} w-full`}
          >
            {busy ? "Checking…" : "Sign in"}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => void resend()}
              disabled={busy}
              className={textAction}
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setError(null);
              }}
              className={textAction}
            >
              Different email
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back."
      description="Enter the email on your account and we will send a one-time code. No passwords."
    >
      <form onSubmit={sendCode} className="space-y-4">
        <Field label="Email">
          <input
            autoFocus
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </Field>

        {error ? <AuthError>{error}</AuthError> : null}

        <button type="submit" disabled={busy} className={`${primaryAction} w-full normal-case`}>
          {busy ? "Sending…" : "Send Code"}
        </button>
      </form>

      <p className="mt-6 pt-4 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="underline underline-offset-4 hover:text-signal">
          Open an account
        </Link>
      </p>
    </AuthShell>
  );
}
