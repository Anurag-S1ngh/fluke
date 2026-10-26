import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@fluke/ui/components/accordion";

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

        <Accordion
          defaultValue={[faqs[0].q]}
          className="mx-auto mt-16 max-w-3xl border-t border-border"
        >
          {faqs.map(({ q, a }) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="items-center px-6 py-5 font-serif text-xl leading-snug font-normal hover:text-signal hover:no-underline">
                {q}
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <p className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
