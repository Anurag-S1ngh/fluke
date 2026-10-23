import type * as React from "react";

import { labelClass } from "./actions";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className={labelClass}>{label}</span>
        {hint ? <span className="font-mono text-[10px] text-muted-foreground">{hint}</span> : null}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
