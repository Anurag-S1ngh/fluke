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
            "radial-gradient(ellipse 95% 42% at 50% 58%, rgba(32,54,255,0.97) 0%, rgba(32,54,255,0.9) 42%, rgba(32,54,255,0.58) 72%, rgba(32,54,255,0) 100%), linear-gradient(to bottom, rgba(32,54,255,0.9) 0%, rgba(32,54,255,0.78) 36%, rgba(32,54,255,0.5) 68%, rgba(32,54,255,0.16) 88%, rgba(32,54,255,0) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "radial-gradient(ellipse 95% 80% at 50% 52%, rgba(32,54,255,0.92) 0%, rgba(32,54,255,0.78) 36%, rgba(32,54,255,0.45) 65%, rgba(32,54,255,0.12) 86%, rgba(32,54,255,0) 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-7xl items-center justify-center px-6 pt-28 pb-16 text-center lg:pt-32 lg:pb-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <h1 className="max-w-3xl font-serif text-[clamp(3.25rem,6vw,6rem)] leading-[0.92] tracking-[-0.02em] text-balance [text-shadow:0_2px_30px_rgba(18,30,150,0.45)]">
            Tomorrow, <em className="text-white/70">priced</em> in cents.
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-white/85 [text-shadow:0_1px_2px_rgba(18,30,150,0.6),0_2px_18px_rgba(18,30,150,0.6)] sm:text-lg">
            A prediction market for real-world outcomes. Buy YES or NO on a question, and let the
            price say what everyone believes.
          </p>

          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-6">
            <Link
              href="/markets"
              className={cn(
                primaryAction,
                "h-11 w-full max-w-[16rem] border-white bg-white px-6 text-xs text-[#2036ff] hover:bg-white/90 hover:text-[#2036ff] sm:w-auto",
              )}
            >
              Browse markets
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="#how-it-works"
              className={cn(
                textAction,
                "inline-flex h-11 items-center px-2 text-white/90 [text-shadow:0_1px_2px_rgba(18,30,150,0.7),0_2px_16px_rgba(18,30,150,0.7)] hover:text-white",
              )}
            >
              How it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
