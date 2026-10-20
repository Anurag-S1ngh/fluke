"use client";

import Link from "next/link";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  return (
    <header className="border-b-2 border-foreground">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-serif text-3xl leading-none tracking-[-0.02em]">
            fluke<span className="text-signal">.</span>
          </span>
          <span className="hidden font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase sm:inline">
            A prediction market
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase md:inline">
            Vol. I — prices in cents
          </span>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
