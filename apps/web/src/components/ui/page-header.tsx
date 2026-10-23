import type * as React from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b-2 border-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pt-12 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-signal">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.02] tracking-[-0.01em] text-balance sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
