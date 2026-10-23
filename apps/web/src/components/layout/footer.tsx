import { cn } from "@fluke/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { primaryAction } from "@/components/ui/actions";

const socials = ["X", "Discord", "GitHub"];

const pages: { href: Route; label: string }[] = [
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
];

function SocialLinks() {
  return (
    <nav aria-label="Socials">
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
        Socials
      </p>
      <ul className="mt-3 space-y-2">
        {socials.map((label) => (
          <li key={label}>
            <a href="#" className="text-sm hover:text-signal">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function PageLinks({ landing }: { landing: boolean }) {
  return (
    <nav aria-label="Pages">
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
        Pages
      </p>
      <ul className="mt-3 space-y-2">
        {pages.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className="text-sm hover:text-signal">
              {label}
            </Link>
          </li>
        ))}
        {landing ? (
          <>
            <li>
              <Link href="#how-it-works" className="text-sm hover:text-signal">
                How it works
              </Link>
            </li>
            <li>
              <Link href="#example" className="text-sm hover:text-signal">
                An example
              </Link>
            </li>
            <li>
              <Link href="#the-rules" className="text-sm hover:text-signal">
                The rules
              </Link>
            </li>
            <li>
              <Link href="#faq" className="text-sm hover:text-signal">
                Questions
              </Link>
            </li>
          </>
        ) : (
          <li>
            <Link href="/#how-it-works" className="text-sm hover:text-signal">
              How it works
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

function FullFooter() {
  return (
    <footer className="mx-auto max-w-7xl px-6 pb-10">
      <div className="flex flex-col items-center gap-6 py-28 text-center sm:py-36">
        <p className="max-w-[22ch] font-serif text-3xl leading-tight tracking-[-0.01em] text-balance sm:text-4xl">
          Put your conviction where the price is.
        </p>
        <Link href="/markets" className={cn(primaryAction, "h-11 px-6 text-xs")}>
          Browse markets
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <div className="border-b-2 border-foreground py-6">
        <p className="font-serif text-[clamp(4rem,15vw,10rem)] leading-[0.8] tracking-[-0.04em]">
          fluke<span className="text-signal">.</span>
        </p>
      </div>

      <div className="grid gap-10 py-10 lg:grid-cols-[1fr_auto] lg:gap-24">
        <div>
          <p className="max-w-[36ch] text-sm leading-relaxed text-muted-foreground">
            A prediction market for real-world outcomes. YES pays $1.00, NO pays $0.00 — the price
            is the forecast.
          </p>
          <p className="mt-4 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            © {new Date().getFullYear()} fluke
          </p>
        </div>

        <div className="grid w-fit gap-10 sm:grid-cols-[auto_auto] sm:justify-end sm:gap-16 lg:justify-self-end lg:gap-24">
          <SocialLinks />
          <PageLinks landing />
        </div>
      </div>
    </footer>
  );
}

function CompactFooter() {
  return (
    <footer className="border-t-2 border-foreground">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-16">
          <div>
            <Link href="/" className="font-serif text-2xl leading-none tracking-[-0.02em]">
              fluke<span className="text-signal">.</span>
            </Link>
            <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-muted-foreground">
              A prediction market for real-world outcomes. YES pays $1.00, NO pays $0.00 — the price
              is the forecast.
            </p>
          </div>

          <div className="flex w-fit gap-10 sm:gap-16">
            <SocialLinks />
            <PageLinks landing={false} />
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-4 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          © {new Date().getFullYear()} fluke
        </p>
      </div>
    </footer>
  );
}

export function SiteFooter({ variant = "compact" }: { variant?: "compact" | "full" }) {
  return variant === "full" ? <FullFooter /> : <CompactFooter />;
}
