"use client";

import { cn } from "@fluke/ui/lib/utils";
import { Menu } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/atoms/auth";

import { MobileNav } from "./mobile-nav";

const baseLinks = [
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const links: { href: Route; label: string }[] = [...baseLinks];
  if (user?.role === "ADMIN") {
    links.push({ href: "/admin", label: "Admin" });
  }
  const redirect = pathname === "/signin" || pathname === "/signup" ? null : pathname;
  const authHref = (base: "/signin" | "/signup") =>
    (redirect ? `${base}?next=${encodeURIComponent(redirect)}` : base) as Route;
  const isHome = pathname === "/";
  const headerRef = React.useRef<HTMLElement>(null);
  const menuTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [pastHero, setPastHero] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);

  // Navigating (link click, history, redirect) always dismisses the drawer.
  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    const applyHeight = () => {
      document.documentElement.style.setProperty("--header-h", `${node.offsetHeight}px`);
    };
    applyHeight();
    const observer = new ResizeObserver(applyHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isHome) return;
    const main = document.querySelector("main");
    if (!main) return;
    const onScroll = () => {
      const hero = main.querySelector("section");
      const headerHeight = headerRef.current?.offsetHeight ?? 96;
      const threshold = hero ? hero.offsetHeight - headerHeight : window.innerHeight - headerHeight;
      setPastHero(main.scrollTop > threshold);
    };
    onScroll();
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const overlay = isHome && !pastHero;

  return (
    <header
      ref={headerRef}
      className={cn(
        "transition-[background-color,border-color,color] duration-200",
        overlay
          ? "absolute inset-x-0 top-0 z-50 bg-transparent text-white"
          : isHome
            ? "absolute inset-x-0 top-0 z-50 border-b-2 border-foreground bg-background"
            : "border-b-2 border-foreground bg-transparent",
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-x-6 px-6 py-4">
        <Link href="/" className="font-serif text-3xl leading-none tracking-[-0.02em]">
          fluke<span className={overlay ? "text-white/70" : "text-signal"}>.</span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 font-sans text-sm font-medium tracking-[0.06em] capitalize lg:flex"
        >
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-my-2 inline-flex items-center py-2 underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4",
                  overlay
                    ? "hover:text-white hover:underline focus-visible:outline-white"
                    : "hover:text-signal focus-visible:outline-foreground",
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

        <div className="hidden items-center gap-6 font-sans text-sm font-medium tracking-[0.06em] lg:flex">
          {loading ? (
            <span className={overlay ? "text-white/70" : "text-muted-foreground"}>···</span>
          ) : user ? (
            <>
              <span className={overlay ? "text-white/70" : "text-muted-foreground"}>
                {user.username}
              </span>
              <span className={overlay ? "text-white/70" : "text-muted-foreground"}>·</span>
              <span>{formatMoney(user.balance)}</span>
              <button
                type="button"
                onClick={() => void signOut()}
                className={cn(
                  "-my-2 inline-flex items-center py-2 underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4",
                  overlay
                    ? "hover:text-white hover:underline focus-visible:outline-white"
                    : "underline hover:text-signal focus-visible:outline-foreground",
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
                  "-my-2 inline-flex items-center py-2 underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4",
                  overlay
                    ? "hover:text-white hover:underline focus-visible:outline-white"
                    : "underline hover:text-signal focus-visible:outline-foreground",
                )}
              >
                Sign in
              </Link>
              <Link
                href={authHref("/signup")}
                className={cn(
                  "inline-flex items-center border px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4",
                  overlay
                    ? "border-white hover:bg-white hover:text-[#2036ff] focus-visible:outline-white"
                    : "border-foreground hover:bg-foreground hover:text-background focus-visible:outline-foreground",
                )}
              >
                Join
              </Link>
            </>
          )}
        </div>

        <button
          ref={menuTriggerRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(true)}
          className={cn(
            "inline-flex size-10 items-center justify-center border bg-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden",
            overlay
              ? "border-white/50 text-white hover:border-white hover:bg-white hover:text-[#2036ff] focus-visible:outline-white"
              : "border-foreground/30 text-foreground hover:border-foreground hover:bg-foreground hover:text-background focus-visible:outline-foreground",
          )}
        >
          <Menu aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </button>
      </div>

      <MobileNav
        open={menuOpen}
        onClose={closeMenu}
        triggerRef={menuTriggerRef}
        links={links}
        pathname={pathname}
        loading={loading}
        user={user}
        signOut={signOut}
        signInHref={authHref("/signin")}
        signUpHref={authHref("/signup")}
      />
    </header>
  );
}
