import type * as React from "react";

import { SectionMark } from "@/components/ui/section-mark";

import { NoticeArt, NumberArt, StakeArt } from "./why-art";

const features: { title: string; body: string; art: React.ReactNode }[] = [
  {
    title: "Skin in the game",
    body: "Polls record what people say. Prices record what they will back with money — a harder signal to fake.",
    art: <StakeArt />,
  },
  {
    title: "One number",
    body: "No pundit panel, no thread to decode. The price is the forecast, updated on every trade.",
    art: <NumberArt />,
  },
  {
    title: "Settled in public",
    body: "Each question states its source and date up front. If it cannot resolve as written, everyone is refunded.",
    art: <NoticeArt />,
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

        <ul className="mx-auto mt-16 max-w-6xl divide-y divide-foreground/15 border border-foreground/15">
          {features.map(({ title, body, art }, index) => (
            <li key={title} className="grid items-stretch sm:grid-cols-2">
              <div className="flex items-center justify-center border-b border-foreground/15 bg-secondary/40 px-8 py-10 sm:border-r sm:border-b-0">
                <div className="w-full max-w-[21rem]">{art}</div>
              </div>
              <div className="flex flex-col justify-center px-8 py-10 sm:px-12">
                <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
                  Fig. {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-serif text-2xl">{title}</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
