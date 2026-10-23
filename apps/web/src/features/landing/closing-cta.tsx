import { cn } from "@fluke/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { primaryAction } from "@/components/ui/actions";

export function ClosingCta() {
  return (
    <section className="mx-auto max-w-7xl px-6">
      <div className="flex flex-col items-center gap-6 py-28 text-center sm:py-36">
        <p className="max-w-[22ch] font-serif text-3xl leading-tight tracking-[-0.01em] text-balance sm:text-4xl">
          Put your conviction where the price is.
        </p>
        <Link href="/markets" className={cn(primaryAction, "h-11 px-6 text-xs")}>
          Browse markets
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
