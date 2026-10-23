import { cn } from "@fluke/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { AsciiWaves } from "@/components/common/ascii-waves";
import { primaryAction, textAction } from "@/components/ui/actions";

export function Hero() {
  return (
    <section className="relative isolate -mb-px overflow-hidden border-b-2 border-[#2036ff] bg-[#2036ff] text-white selection:bg-white selection:text-[#2036ff]">
      <AsciiWaves />
      <div
        aria-hidden="true"
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(32,54,255,0.88) 0%, rgba(32,54,255,0.72) 32%, rgba(32,54,255,0.42) 62%, rgba(32,54,255,0.12) 85%, rgba(32,54,255,0) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "radial-gradient(ellipse 120% 105% at 50% 42%, rgba(32,54,255,0.78) 0%, rgba(32,54,255,0.62) 32%, rgba(32,54,255,0.32) 58%, rgba(32,54,255,0.08) 80%, rgba(32,54,255,0) 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-7xl items-center justify-center px-6 pt-28 pb-16 text-center lg:pt-32 lg:pb-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <h1 className="max-w-3xl font-serif text-[clamp(3.25rem,6vw,6rem)] leading-[0.92] tracking-[-0.02em] text-balance">
            Tomorrow, <em className="text-white/70">priced</em> in cents.
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            A prediction market for real-world outcomes. Buy YES or NO on a question, and let the
            price say what everyone believes.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/markets"
              className={cn(
                primaryAction,
                "h-11 border-white bg-white px-6 text-xs text-[#2036ff] hover:bg-white/90 hover:text-[#2036ff]",
              )}
            >
              Browse markets
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link href="#how-it-works" className={cn(textAction, "text-white/80 hover:text-white")}>
              How it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
