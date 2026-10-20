import { ArrowRight, ArrowUp } from "lucide-react";
import Link from "next/link";

const tape = [
  { name: "Mars 2030", price: "62¢", move: "▲ 4" },
  { name: "Fusion net", price: "18¢", move: "▲ 2" },
  { name: "AI moratorium", price: "41¢", move: "▼ 3" },
  { name: "Moon base", price: "09¢", move: "▼ 1" },
  { name: "Open source", price: "74¢", move: "▲ 6" },
  { name: "Sea level", price: "55¢", move: "▲ 1" },
];

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

function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] uppercase">
      <span className="bg-signal px-1.5 py-0.5 text-background">{n}</span>
      <span className="text-muted-foreground">{children}</span>
    </p>
  );
}

export default function Home() {
  return (
    <main id="top" className="h-full overflow-y-auto selection:bg-signal selection:text-background">
      <div className="border-b border-foreground bg-foreground text-background">
        <div className="mx-auto flex max-w-7xl items-stretch">
          <span className="hidden shrink-0 items-center border-r border-background/25 px-4 font-mono text-[10px] tracking-[0.2em] uppercase sm:flex">
            Sample tape
          </span>
          <div className="relative flex-1 overflow-hidden py-2">
            <div
              aria-hidden="true"
              className="flex w-max animate-[ticker_40s_linear_infinite] motion-reduce:animate-none"
            >
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0">
                  {tape.map(({ name, price, move }) => (
                    <span
                      key={`${copy}-${name}`}
                      className="flex items-center gap-3 px-5 font-mono text-[11px] tracking-[0.12em] whitespace-nowrap uppercase"
                    >
                      <span>{name}</span>
                      <span className="opacity-40">/</span>
                      <span>{price}</span>
                      <span className="opacity-60">{move}</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-14 px-6 pt-12 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16 lg:pt-16 lg:pb-24">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase">
            <span aria-hidden="true" className="size-2 bg-signal" />
            The future, quoted daily
          </p>

          <h1 className="mt-6 font-serif text-[clamp(3.25rem,7.5vw,6.5rem)] leading-[0.95] tracking-[-0.02em] text-balance">
            Tomorrow, <em className="text-signal">priced</em> in cents.
          </h1>

          <p className="mt-7 max-w-[46ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            fluke is a prediction market for real-world outcomes. Buy YES or NO on a question, and
            let the price say what everyone believes.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href="#how-it-works"
              className="inline-flex h-11 items-center gap-3 border-2 border-foreground bg-foreground px-5 font-mono text-[11px] tracking-[0.18em] text-background uppercase transition-colors hover:bg-background hover:text-foreground"
            >
              Read the tape
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="#the-rules"
              className="font-mono text-[11px] tracking-[0.18em] uppercase underline decoration-1 underline-offset-4 hover:text-signal"
            >
              How it settles
            </Link>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t-2 border-foreground pt-4 font-mono text-[10px] tracking-[0.12em] uppercase">
            <div>
              <dt className="text-muted-foreground">One share</dt>
              <dd className="mt-1 text-sm">$1.00</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fees</dt>
              <dd className="mt-1 text-sm">None</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Counterparty</dt>
              <dd className="mt-1 text-sm">A reader</dd>
            </div>
          </dl>
        </div>

        <aside className="relative lg:mt-2">
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 border border-foreground/40"
          />
          <article className="relative border-2 border-foreground bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              <span>Specimen front page</span>
              <span>No. 001</span>
            </div>

            <p className="mt-5 font-serif text-3xl leading-[1.05] tracking-[-0.01em]">
              Will humans land on Mars before 2030?
            </p>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                  Yes, per share
                </p>
                <p className="mt-1 font-mono text-6xl leading-none tracking-[-0.05em]">62¢</p>
              </div>
              <p className="pb-1 font-mono text-[11px] tracking-[0.12em] text-signal uppercase">
                ▲ 4¢ today
              </p>
            </div>

            <div className="mt-6">
              <div className="flex h-3 w-full overflow-hidden border border-foreground">
                <div className="w-[62%] bg-signal" />
                <div className="flex-1 bg-foreground" />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] tracking-[0.14em] uppercase">
                <span>Yes 62</span>
                <span className="text-muted-foreground">No 38</span>
              </div>
            </div>

            <p className="mt-6 border-t border-border pt-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Volume 12,480 · closes Jan 2030
            </p>

            <span className="absolute -top-3 -right-3 rotate-6 border-2 border-signal bg-card px-2 py-1 font-mono text-[9px] tracking-[0.2em] text-signal uppercase">
              Illustrative
            </span>
          </article>
        </aside>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-t-2 border-foreground">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-20">
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionMark n="01">How it works</SectionMark>
              <h2 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.01em] sm:text-4xl">
                Three moves, one opinion.
              </h2>
            </div>
            <p className="max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
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

      <section className="relative overflow-hidden border-y-2 border-foreground bg-signal text-background">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] text-background opacity-20 [background-size:6px_6px]"
        />
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center sm:py-24">
          <p className="font-mono text-[10px] tracking-[0.24em] uppercase">
            From the editorial desk
          </p>
          <blockquote className="mt-6 font-serif text-[clamp(2rem,5vw,3.75rem)] leading-[1.05] text-balance">
            “A price is an opinion that has <em>skin in the game</em>.”
          </blockquote>
          <p className="mt-6 font-mono text-[10px] tracking-[0.2em] uppercase">
            — The fluke principle
          </p>
        </div>
      </section>

      <section id="the-rules" className="scroll-mt-24 border-b-2 border-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <SectionMark n="02">The rules</SectionMark>
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

      <footer className="mx-auto max-w-7xl px-6 pb-10">
        <div className="flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-[24ch] font-serif text-2xl leading-tight tracking-[-0.01em] text-balance sm:text-3xl">
            The first markets are on their way.
          </p>
          <Link
            href="#top"
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase underline decoration-1 underline-offset-4 hover:text-signal"
          >
            Back to top
            <ArrowUp aria-hidden="true" className="size-3.5" />
          </Link>
        </div>

        <div className="border-b-2 border-foreground py-6">
          <p className="font-serif text-[clamp(4rem,15vw,10rem)] leading-[0.8] tracking-[-0.04em]">
            fluke<span className="text-signal">.</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} fluke — printed continuously in your browser</span>
          <span>Vol. I · No. 001 · prices in cents</span>
        </div>
      </footer>
    </main>
  );
}
