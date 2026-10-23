"use client";

import { cn } from "@fluke/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { formatMoney } from "@/lib/format";
import { useAuth } from "./auth-provider";

const baseLinks = [
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const links: { href: Route; label: string }[] = [...baseLinks];
  const redirect = pathname === "/signin" || pathname === "/signup" ? null : pathname;
  const authHref = (base: "/signin" | "/signup") =>
    (redirect ? `${base}?next=${encodeURIComponent(redirect)}` : base) as Route;
  const isHome = pathname === "/";
  const [pastHero, setPastHero] = React.useState(false);

  React.useEffect(() => {
    if (!isHome) return;
    const main = document.querySelector("main");
    if (!main) return;
    const onScroll = () => {
      const hero = main.querySelector("section");
      const threshold = hero ? (hero as HTMLElement).offsetHeight - 96 : window.innerHeight - 96;
      setPastHero(main.scrollTop > threshold);
    };
    onScroll();
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const overlay = isHome && !pastHero;

  return (
    <header
      className={cn(
        overlay
          ? "absolute inset-x-0 top-0 z-50 bg-transparent text-white"
          : isHome
            ? "absolute inset-x-0 top-0 z-50 border-b-2 border-foreground bg-background"
            : "border-b-2 border-foreground bg-transparent",
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
        <Link href="/" className="font-serif text-3xl leading-none tracking-[-0.02em]">
          fluke<span className={overlay ? "text-white/70" : "text-signal"}>.</span>
        </Link>

        <nav className="flex items-center gap-10 font-sans text-sm font-medium tracking-[0.06em] capitalize">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "underline-offset-4 transition-colors",
                  overlay ? "hover:text-white hover:underline" : "hover:text-signal",
                  active &&
                    (overlay
                      ? "text-white underline decoration-1"
                      : "text-signal underline decoration-1"),
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex w-full items-center justify-end gap-6 font-sans text-sm font-medium tracking-[0.06em] capitalize sm:w-auto sm:justify-start">
          {loading ? (
            <span className={overlay ? "text-white/70" : "text-muted-foreground"}>···</span>
          ) : user ? (
            <>
              <span
                className={cn(
                  "hidden sm:inline",
                  overlay ? "text-white/70" : "text-muted-foreground",
                )}
              >
                {user.username}
              </span>
              <span
                className={cn(
                  "hidden sm:inline",
                  overlay ? "text-white/70" : "text-muted-foreground",
                )}
              >
                ·
              </span>
              <span>{formatMoney(user.balance)}</span>
              <button
                type="button"
                onClick={() => void signOut()}
                className={cn(
                  "underline-offset-4 transition-colors",
                  overlay ? "hover:text-white hover:underline" : "underline hover:text-signal",
                )}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href={authHref("/signin")}
                className={cn(
                  "underline-offset-4 transition-colors",
                  overlay ? "hover:text-white hover:underline" : "underline hover:text-signal",
                )}
              >
                Sign in
              </Link>
              <Link
                href={authHref("/signup")}
                className={cn(
                  "border px-2 py-1 transition-colors",
                  overlay
                    ? "border-white hover:bg-white hover:text-[#2036ff]"
                    : "border-foreground hover:bg-foreground hover:text-background",
                )}
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
