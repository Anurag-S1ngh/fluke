import type * as React from "react";
import Link from "next/link";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative h-full overflow-y-auto">
      <Link
        href="/"
        aria-label="Back to home"
        className="absolute top-6 left-8 font-serif text-3xl leading-none tracking-[-0.02em]"
      >
        fluke<span className="text-signal">.</span>
      </Link>
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16 sm:py-24">
        <h1 className="font-serif text-4xl leading-[1.02] tracking-[-0.01em] text-balance sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="border-l-2 border-destructive pl-3 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-destructive"
    >
      {children}
    </p>
  );
}
