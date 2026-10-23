import { SectionMark } from "@/components/ui/section-mark";

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

export function WhyPrices() {
  return (
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
  );
}
