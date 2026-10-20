"use client";

import Link from "next/link";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-medium tracking-[-0.02em]">
          fluke<span className="text-primary">.</span>
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
