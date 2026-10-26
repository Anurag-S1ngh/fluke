import type * as React from "react";

import { SectionMark } from "@/components/ui/section-mark";

import { BallotArt, BeamArt, PayoutArt } from "./steps-art";

function StepCard({ title, body, art }: { title: string; body: string; art: React.ReactNode }) {
  return (
    <li className="flex flex-col">
      <div className="flex flex-1 items-center justify-center border-b border-foreground/15 bg-secondary/40 px-6 py-8">
        <div className="w-full max-w-[14rem]">{art}</div>
      </div>

      <div className="flex flex-col px-6 py-7">
        <h3 className="font-serif text-xl">{title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-b-2 border-foreground">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36">
        <div className="flex flex-col items-center gap-4 text-center">
          <SectionMark n="01">How it works</SectionMark>
          <h2 className="mt-2 font-serif text-3xl leading-tight tracking-[-0.01em] text-balance sm:text-4xl">
            Three moves, one opinion.
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-balance text-muted-foreground">
            No leverage, no derivatives, no jargon. Just a question, a price, and a date.
          </p>
        </div>

        <ol className="mx-auto mt-16 grid max-w-6xl divide-y divide-foreground/15 border border-foreground/15 md:grid-cols-3 md:divide-x md:divide-y-0">
          <StepCard
            title="Take a side"
            body="Read the question and buy YES or NO. Your conviction becomes a position, priced in cents."
            art={<BallotArt />}
          />

          <StepCard
            title="Set the price"
            body="Every order meets another reader. The last trade is the market's best guess at the truth."
            art={<BeamArt />}
          />

          <StepCard
            title="Collect the answer"
            body="When the question closes, winning shares pay one dollar each. Losing shares expire."
            art={<PayoutArt />}
          />
        </ol>
      </div>
    </section>
  );
}
