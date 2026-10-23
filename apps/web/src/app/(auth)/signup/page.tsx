import type { Metadata } from "next";

import { SignUpForm } from "@/features/auth/signup-form";

export const metadata: Metadata = {
  title: "Join — fluke",
  description: "Open a fluke account and start trading on real-world questions.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next;
  return <SignUpForm next={next} />;
}
