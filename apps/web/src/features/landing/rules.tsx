import { SectionMark } from "@/components/ui/section-mark";

const terms = [
  { term: "A winning share", value: "$1.00" },
  { term: "A losing share", value: "$0.00" },
  { term: "Prices quoted in", value: "cents" },
  { term: "Trading fees", value: "none" },
  { term: "Settlement", value: "stated date" },
  { term: "Counterparty", value: "another reader" },
];

export function Rules() {
  return (
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
          <p className="mt-8 max-w-[38ch] border-l-2 border-signal pl-4 font-mono text-[10px] leading-relaxed tracking-[0.14em] text-muted-foreground">
            If a question cannot be resolved as written, every position is refunded in full.
          </p>
        </div>

        <dl className="self-end border-t-2 border-foreground">
          {terms.map(({ term, value }) => (
            <div
              key={term}
              className="flex items-baseline justify-between gap-4 border-b border-border py-4"
            >
              <dt className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
                {term}
              </dt>
              <dd className="font-mono text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
