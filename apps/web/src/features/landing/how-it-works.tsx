import { SectionMark } from "@/components/ui/section-mark";

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

export function HowItWorks() {
  return (
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
  );
}
