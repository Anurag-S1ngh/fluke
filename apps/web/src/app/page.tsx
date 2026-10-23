import { cn } from "@fluke/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { AsciiWaves } from "@/components/ascii-waves";
import { primaryAction, SectionMark, textAction } from "@/components/ui-bits";

const steps = [
  {
    n: "01",
    title: "Take a side",
    body: "Read the question and buy YES or NO. Your conviction becomes a position, priced in cents.",
  },
  {
    n: "02",
    title: "Set the price",
    body: "Every order meets another reader. The last trade is the market's best guess at the truth.",
  },
  {
    n: "03",
    title: "Collect the answer",
    body: "When the question closes, winning shares pay one dollar each. Losing shares expire.",
  },
];

const terms = [
  { term: "A winning share", value: "$1.00" },
  { term: "A losing share", value: "$0.00" },
  { term: "Prices quoted in", value: "cents" },
  { term: "Trading fees", value: "none" },
  { term: "Settlement", value: "stated date" },
  { term: "Counterparty", value: "another reader" },
];

const features = [
  {
    title: "Skin in the game",
    body: "Polls record what people say. Prices record what they will back with money — a harder signal to fake.",
  },
  {
    title: "One number",
    body: "No pundit panel, no thread to decode. The price is the forecast, updated on every trade.",
  },
  {
    title: "Settled in public",
    body: "Each question states its source and date up front. If it cannot resolve as written, everyone is refunded.",
  },
];

const faqs = [
  {
    q: "What happens if I am right?",
    a: "Each winning share pays $1.00. A share bought at 64¢ returns $1.00 — the difference is your gain.",
  },
  {
    q: "When do I get paid?",
    a: "After the question closes and resolves. Losing shares expire worthless; winning shares settle to cash.",
  },
  {
    q: "Who am I trading against?",
    a: "Another reader on the other side of the question. There is no house position and no hidden spread.",
  },
  {
    q: "What if a question is unclear?",
    a: "If it cannot be resolved as written, every position is refunded in full. No judgment calls, no haircuts.",
  },
];

export default function Home() {
  return (
    <main id="top" className="h-full overflow-y-auto selection:bg-signal selection:text-background">
      <section className="relative isolate -mb-px overflow-hidden border-b-2 border-[#2036ff] bg-[#2036ff] text-white selection:bg-white selection:text-[#2036ff]">
        <AsciiWaves />
        <div
          aria-hidden="true"
          className="absolute inset-0 md:hidden"
          style={{
            background:
              "linear-gradient(to bottom, rgba(32,54,255,0.88) 0%, rgba(32,54,255,0.72) 32%, rgba(32,54,255,0.42) 62%, rgba(32,54,255,0.12) 85%, rgba(32,54,255,0) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden md:block"
          style={{
            background:
              "radial-gradient(ellipse 120% 105% at 50% 42%, rgba(32,54,255,0.78) 0%, rgba(32,54,255,0.62) 32%, rgba(32,54,255,0.32) 58%, rgba(32,54,255,0.08) 80%, rgba(32,54,255,0) 100%)",
          }}
        />

        <div className="relative mx-auto flex min-h-svh w-full max-w-7xl items-center justify-center px-6 pt-28 pb-16 text-center lg:pt-32 lg:pb-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center">
            <h1 className="max-w-3xl font-serif text-[clamp(3.25rem,6vw,6rem)] leading-[0.92] tracking-[-0.02em] text-balance">
              Tomorrow, <em className="text-white/70">priced</em> in cents.
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              A prediction market for real-world outcomes. Buy YES or NO on a question, and let the
              price say what everyone believes.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
              <Link
                href="/markets"
                className={cn(
                  primaryAction,
                  "h-11 border-white bg-white px-6 text-xs text-[#2036ff] hover:bg-white/90 hover:text-[#2036ff]",
                )}
              >
                Browse markets
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="#how-it-works"
                className={cn(textAction, "text-white/80 hover:text-white")}
              >
                How it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-b-2 border-foreground">
        <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36">
          <div className="flex flex-col items-center gap-4 border-b border-border pb-8 text-center">
            <SectionMark n="01">How it works</SectionMark>
            <h2 className="mt-2 font-serif text-3xl leading-tight tracking-[-0.01em] text-balance sm:text-4xl">
              Three moves, one opinion.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              No leverage, no derivatives, no jargon. Just a question, a price, and a date.
            </p>
          </div>

          <ol className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {steps.map(({ n, title, body }) => (
              <li key={n} className="py-8 sm:px-8 sm:first:pl-0 sm:last:pr-0">
                <p className="font-serif text-5xl leading-none text-signal">{n}</p>
                <h3 className="mt-5 font-serif text-2xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="example" className="scroll-mt-24 border-b-2 border-foreground">
        <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36">
          <div className="flex flex-col items-center gap-4 text-center">
            <SectionMark n="02">An example</SectionMark>
            <h2 className="mt-2 max-w-xl font-serif text-3xl leading-tight tracking-[-0.01em] text-balance sm:text-4xl">
              One question, two prices.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              The market below is illustrative. The split is the forecast — it moves with every
              trade.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-3xl border-2 border-foreground">
            <div className="border-b border-border px-6 py-4">
              <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                Open · Closes on stated date
              </p>
              <p className="mt-2 font-serif text-2xl leading-tight text-balance sm:text-3xl">
                Will the city break its all-time heat record this summer?
              </p>
            </div>
            <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
              <div className="border border-border p-4">
                <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                  YES
                </p>
                <p className="mt-1 font-mono text-3xl">64¢</p>
                <div className="mt-3 h-2 bg-muted" role="img" aria-label="YES priced at 64 cents">
                  <div className="h-full w-[64%] bg-signal" />
                </div>
              </div>
              <div className="border border-border p-4">
                <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                  NO
                </p>
                <p className="mt-1 font-mono text-3xl">36¢</p>
                <div className="mt-3 h-2 bg-muted" role="img" aria-label="NO priced at 36 cents">
                  <div className="h-full w-[36%] bg-foreground" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Last trade says: <span className="text-foreground">likely yes, far from sure.</span>
              </p>
              <Link href="/markets" className={cn(primaryAction, "h-10 px-5 text-[11px]")}>
                Trade this idea
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-foreground">
        <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36">
          <div className="flex flex-col items-center gap-4 text-center">
            <SectionMark n="03">Why prices</SectionMark>
            <h2 className="mt-2 max-w-xl font-serif text-3xl leading-tight tracking-[-0.01em] text-balance sm:text-4xl">
              Opinions are cheap. Prices aren&apos;t.
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-px border-2 border-foreground bg-border sm:grid-cols-3">
            {features.map(({ title, body }) => (
              <div key={title} className="bg-background px-8 py-12 sm:py-16">
                <h3 className="font-serif text-2xl">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b-2 border-foreground bg-signal text-background">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] text-background opacity-20 [background-size:6px_6px]"
        />
        <div className="relative mx-auto max-w-4xl px-6 py-32 text-center sm:py-44">
          <blockquote className="font-serif text-[clamp(2rem,5vw,3.75rem)] leading-[1.05] text-balance">
            “A price is an opinion that has <em>skin in the game</em>.”
          </blockquote>
        </div>
      </section>

      <section id="the-rules" className="scroll-mt-24 border-b-2 border-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-28 sm:py-36 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <SectionMark n="04">The rules</SectionMark>
            <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.01em] text-balance sm:text-5xl">
              Plain terms, printed clearly.
            </h2>
            <p className="mt-5 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
              No hidden spread, no house on the other side, no fine print in a modal. The whole
              contract fits on one page.
            </p>
            <p className="mt-8 max-w-[38ch] border-l-2 border-signal pl-4 font-mono text-[10px] leading-relaxed tracking-[0.14em] text-muted-foreground uppercase">
              If a question cannot be resolved as written, every position is refunded in full.
            </p>
          </div>

          <dl className="self-end border-t-2 border-foreground">
            {terms.map(({ term, value }) => (
              <div
                key={term}
                className="flex items-baseline justify-between gap-4 border-b border-border py-4"
              >
                <dt className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                  {term}
                </dt>
                <dd className="font-mono text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-b-2 border-foreground">
        <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36">
          <div className="flex flex-col items-center gap-4 text-center">
            <SectionMark n="05">Questions</SectionMark>
            <h2 className="mt-2 font-serif text-3xl leading-tight tracking-[-0.01em] text-balance sm:text-4xl">
              What everyone asks first.
            </h2>
          </div>

          <div className="mx-auto mt-16 max-w-3xl divide-y divide-border">
            {faqs.map(({ q, a }, index) => (
              <details key={q} open={index === 0} className="group bg-background">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden">
                  <span className="font-serif text-xl leading-snug group-hover:text-signal">
                    {q}
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-mono text-lg leading-none text-muted-foreground group-hover:text-signal"
                  >
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

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
            <nav aria-label="Socials">
              <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                Socials
              </p>
              <ul className="mt-3 space-y-2">
                <li>
                  <a href="#" className="text-sm hover:text-signal">
                    X
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-signal">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-signal">
                    GitHub
                  </a>
                </li>
              </ul>
            </nav>

            <nav aria-label="Pages">
              <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                Pages
              </p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/markets" className="text-sm hover:text-signal">
                    Markets
                  </Link>
                </li>
                <li>
                  <Link href="/portfolio" className="text-sm hover:text-signal">
                    Portfolio
                  </Link>
                </li>
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
              </ul>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
}
