import type * as React from "react";

export function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[10px] tracking-[0.2em]">
      <span className="bg-signal px-1.5 py-0.5 text-background">{n}</span>
      <span className="text-muted-foreground">{children}</span>
    </p>
  );
}
