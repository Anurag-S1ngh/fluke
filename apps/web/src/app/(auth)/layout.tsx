import type * as React from "react";

/** Auth routes own their full-screen composition: no navbar, no footer. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-svh">{children}</div>;
}
