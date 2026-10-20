import { buttonVariants } from "@fluke/ui/components/button";
import { cn } from "@fluke/ui/lib/utils";
import { ArrowRight, ArrowUp, BadgeCheck, Scale, TrendingUp } from "lucide-react";
import Link from "next/link";

const rise =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:fill-mode-both";

const steps = [
  {
    n: "01",
    title: "Predict",
    body: "Read the question and pick the outcome you believe in. Your conviction gets a price.",
    Icon: TrendingUp,
  },
  {
    n: "02",
    title: "Trade",
    body: "Buy YES or NO at the market price. Prices move as forecasters disagree with you.",
    Icon: Scale,
  },
  {
    n: "03",
    title: "Settle",
    body: "When the question closes, winning shares pay one dollar. Losing shares expire.",
    Icon: BadgeCheck,
  },
];

const rules = [
  {
    title: "One dollar per share",
    body: "Prices are quoted in cents. A winning share settles at $1, however the market got there.",
  },
  {
    title: "Peer to peer",
    body: "Every trade has another forecaster on the other side. There is no house taking your loss.",
  },
  {
    title: "A deadline for every answer",
    body: "Each market states when it closes and exactly how it will be resolved. No judgement calls.",
  },
];

export default function Home() {
  return (
    <main id="top" className="h-full overflow-y-auto">
      <div className="relative mx-auto w-full max-w-6xl px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 -z-10 size-96 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-[120px]"
        />

        <section className="grid gap-16 pt-16 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:pt-24 lg:pb-28">
          <div>
            <p
              className={cn(
                "flex items-center gap-2 text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase",
                rise,
              )}
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              A prediction market for real-world outcomes
            </p>

            <h1
              className={cn(
                "mt-6 text-[2.75rem] leading-[1.05] font-medium tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.5rem]",
                rise,
                "motion-safe:delay-75",
              )}
            >
              Trade the future,{" "}
              <span className="relative inline-block whitespace-nowrap">
                today
                <svg
                  aria-hidden="true"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-primary"
                >
                  <path
                    d="M3 8.5C48 4 97 3.2 197 6.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-primary">.</span>
            </h1>

            <p
              className={cn(
                "mt-6 max-w-[44ch] text-lg leading-relaxed text-muted-foreground sm:text-xl",
                rise,
                "motion-safe:delay-100",
              )}
            >
              Buy YES or NO on the questions that matter. Every price is a forecast — and every
              forecast can be yours.
            </p>

            <div
              className={cn(
                "mt-9 flex flex-wrap items-center gap-3",
                rise,
                "motion-safe:delay-150",
              )}
            >
              <Link
                href="#how-it-works"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 gap-2 rounded-full px-5 text-sm",
                )}
              >
                How it works
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                href="#why-fluke"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 rounded-full bg-transparent px-5 text-sm",
                )}
              >
                Why fluke
              </Link>
            </div>
          </div>

          <aside className={cn("relative", rise, "motion-safe:delay-200")}>
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  Sample market
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                  Open
                </span>
              </div>

              <p className="mt-5 text-xl leading-snug font-medium text-balance sm:text-[1.35rem]">
                Will humans land on Mars before 2030?
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-primary p-4 text-primary-foreground">
                  <div className="flex items-center justify-between text-[10px] font-medium tracking-[0.16em] uppercase opacity-80">
                    <span>Yes</span>
                    <span>Bid</span>
                  </div>
                  <p className="mt-3 font-mono text-3xl tracking-tight">62¢</p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                    <span>No</span>
                    <span>Ask</span>
                  </div>
                  <p className="mt-3 font-mono text-3xl tracking-tight">38¢</p>
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs">
                <div>
                  <dt className="text-muted-foreground">Volume</dt>
                  <dd className="mt-1 font-mono">12,480</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Closes</dt>
                  <dd className="mt-1 font-mono">Jan 2030</dd>
                </div>
              </dl>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              An illustration — not a live market.
            </p>
          </aside>
        </section>

        <section id="how-it-works" className="scroll-mt-24 border-t border-border py-16 sm:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs text-primary">01 / how it works</p>
              <h2 className="mt-3 text-3xl tracking-[-0.02em] sm:text-4xl">
                Three moves, one opinion.
              </h2>
            </div>
            <p className="max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
              No derivatives, no leverage, no jargon. Just a question, a price, and a date.
            </p>
          </div>

          <ol className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {steps.map(({ n, title, body, Icon }) => (
              <li key={n} className="border-t border-border pt-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{n}</span>
                  <Icon aria-hidden="true" className="size-5 text-primary" />
                </div>
                <h3 className="mt-6 text-lg font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="why-fluke" className="scroll-mt-24 border-t border-border py-16 sm:py-20">
          <p className="font-mono text-xs text-primary">02 / the fine print, in plain words</p>
          <div className="mt-8 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <h2 className="text-3xl tracking-[-0.02em] text-balance sm:text-4xl">
              Simple by design.
            </h2>
            <dl className="grid gap-8 sm:grid-cols-3">
              {rules.map(({ title, body }) => (
                <div key={title}>
                  <dt className="text-sm font-medium">{title}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <footer className="border-t border-border py-14">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs text-primary">03 / status</p>
              <p className="mt-3 text-2xl tracking-[-0.02em] text-balance sm:text-3xl">
                The first markets are on their way.
              </p>
              <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
                Bring an opinion. The price will tell you what everyone else thinks.
              </p>
              <Link
                href="#top"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Back to top
                <ArrowUp aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div aria-hidden="true" className="flex items-center gap-2">
              <span className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                YES
              </span>
              <span className="rounded-full border border-border px-4 py-2 text-sm font-medium">
                NO
              </span>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} fluke</span>
            <span className="font-mono">yes 62¢ / no 38¢</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
