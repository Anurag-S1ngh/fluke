"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/layout/auth-provider";
import { AuthError, AuthShell } from "./auth-shell";
import { inputClass, primaryAction, textAction } from "@/components/ui/actions";
import { Field } from "@/components/ui/field";
import { api } from "@/lib/api";

export function SignUpForm({ next }: { next?: string }) {
  const [step, setStep] = React.useState<"details" | "code">("details");
  const [username, setUsername] = React.useState("");
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
      await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, email }),
      });
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
      await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, email }),
      });
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
      toast.success("Account opened.");
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
            {busy ? "Checking…" : "Open account"}
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
                setStep("details");
                setOtp("");
                setError(null);
              }}
              className={textAction}
            >
              Edit details
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Open an account."
      description="Pick a name, leave an email, and we will send a one-time code. Every new account starts with $1,000 in play money."
    >
      <form onSubmit={sendCode} className="space-y-4">
        <Field label="Username" hint="3–20 characters">
          <input
            autoFocus
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="yourname"
            className={inputClass}
          />
        </Field>

        <Field label="Email">
          <input
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
        Already have an account?{" "}
        <Link href="/signin" className="underline underline-offset-4 hover:text-signal">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
