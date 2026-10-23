import type * as React from "react";

import Header from "./header";

/** Chrome shared by every signed-in/marketing route: sticky header plus a scrollable body row. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-svh grid-rows-[auto_1fr]">
      <Header />
      {children}
    </div>
  );
}
