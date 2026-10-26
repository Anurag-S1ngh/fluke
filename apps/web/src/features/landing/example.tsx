import { cn } from "@fluke/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { primaryAction } from "@/components/ui/actions";
import { SectionMark } from "@/components/ui/section-mark";

export function Example() {
  return (
    <section id="example" className="scroll-mt-[var(--header-h)] border-b-2 border-foreground">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36">
        <div className="flex flex-col items-center gap-4 text-center">
          <SectionMark n="02">An example</SectionMark>
          <h2 className="mt-2 max-w-xl font-serif text-3xl leading-tight tracking-[-0.01em] text-balance sm:text-4xl">
            One question, two prices.
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            The market below is illustrative. The split is the forecast — it moves with every trade.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-3xl border border-border">
          <div className="border-b border-border px-6 py-4">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
              Open · Closes on stated date
            </p>
            <p className="mt-2 font-serif text-2xl leading-tight text-balance sm:text-3xl">
              Will the city break its all-time heat record this summer?
            </p>
          </div>
          <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
            <div className="border border-border p-4">
              <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">YES</p>
              <p className="mt-1 font-mono text-3xl">64¢</p>
              <div className="mt-3 h-2 bg-muted" role="img" aria-label="YES priced at 64 cents">
                <div className="h-full w-[64%] bg-signal" />
              </div>
            </div>
            <div className="border border-border p-4">
              <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">NO</p>
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
  );
}
