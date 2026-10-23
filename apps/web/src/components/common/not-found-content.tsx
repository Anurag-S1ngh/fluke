import Link from "next/link";

import { secondaryAction } from "@/components/ui/actions";

export function NotFoundContent() {
  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
        <p className="font-mono text-[10px] tracking-[0.2em] text-signal uppercase">404</p>
        <h1 className="mt-3 font-serif text-5xl leading-[1.02] tracking-[-0.01em] text-balance">
          Nothing on this page.
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          The question may have moved, or the link was printed wrong. The open markets are still
          where you left them.
        </p>
        <Link href="/markets" className={`${secondaryAction} mt-8`}>
          Browse markets
        </Link>
      </div>
    </main>
  );
}
