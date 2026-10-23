import { SectionMark } from "@/components/ui/section-mark";

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

export function Faq() {
  return (
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
                <span className="font-serif text-xl leading-snug group-hover:text-signal">{q}</span>
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
  );
}
