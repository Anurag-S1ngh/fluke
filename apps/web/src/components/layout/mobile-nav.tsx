"use client";

import { cn } from "@fluke/ui/lib/utils";
import { X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import * as React from "react";

import { primaryAction, secondaryAction } from "@/components/ui/actions";
import { formatMoney } from "@/lib/format";
import type { Me } from "@/lib/types";

type MenuLink = { href: Route; label: string };

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  links: MenuLink[];
  pathname: string;
  loading: boolean;
  user: Me | null;
  signOut: () => Promise<void>;
  signInHref: Route;
  signUpHref: Route;
};

/** Slide-in menu for the primary nav on small screens. */
export function MobileNav({
  open,
  onClose,
  triggerRef,
  links,
  pathname,
  loading,
  user,
  signOut,
  signInHref,
  signUpHref,
}: MobileNavProps) {
  const panelRef = React.useRef<HTMLElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  // Esc closes, Tab stays inside the panel, and focus returns to the trigger.
  React.useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open, onClose, triggerRef]);

  // The shell scrolls inside <main>, so lock that as well as the body.
  React.useEffect(() => {
    if (!open) return;

    const main = document.querySelector<HTMLElement>("main");
    const previousBody = document.body.style.overflow;
    const previousMain = main?.style.overflowY ?? "";

    document.body.style.overflow = "hidden";
    if (main) main.style.overflowY = "hidden";

    return () => {
      document.body.style.overflow = previousBody;
      if (main) main.style.overflowY = previousMain;
    };
  }, [open]);

  // Close if the viewport grows back to the desktop header.
  React.useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (query.matches) onClose();
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open, onClose]);

  return (
    <div
      className={cn("fixed inset-0 z-[60] lg:hidden", !open && "pointer-events-none")}
      aria-hidden={!open}
      inert={!open}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-foreground/35 transition-opacity duration-300 motion-reduce:transition-none",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        ref={panelRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={cn(
          "absolute inset-y-0 right-0 flex w-[min(21rem,88vw)] flex-col border-l-2 border-foreground bg-background text-foreground transition-transform duration-300 ease-out motion-reduce:transition-none",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">Menu</p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 inline-flex size-10 items-center justify-center transition-colors hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1 overflow-y-auto overscroll-contain">
          <ul>
            {links.map(({ href, label }, index) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href} className="border-b border-border">
                  <Link
                    href={href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-baseline justify-between gap-4 px-6 py-5 transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground",
                      active && "text-signal",
                    )}
                  >
                    <span
                      className={cn(
                        "font-serif text-3xl leading-none tracking-[-0.01em]",
                        active && "underline decoration-1 underline-offset-4",
                      )}
                    >
                      {label}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t-2 border-foreground px-6 py-5">
          {loading ? (
            <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">···</p>
          ) : user ? (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
                  Signed in
                </span>
                <span className="truncate text-sm font-medium">{user.username}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-4">
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
                  Balance
                </span>
                <span className="font-mono text-sm">{formatMoney(user.balance)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  void signOut();
                }}
                className={cn(secondaryAction, "mt-5 w-full")}
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="grid gap-3">
              <Link href={signInHref} onClick={onClose} className={cn(secondaryAction, "w-full")}>
                Sign in
              </Link>
              <Link href={signUpHref} onClick={onClose} className={cn(primaryAction, "w-full")}>
                Join
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
