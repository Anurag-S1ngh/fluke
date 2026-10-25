"use client";

import { Toaster } from "@fluke/ui/components/sonner";
import { Provider, useSetAtom } from "jotai";
import * as React from "react";

import { refreshAuthAtom } from "@/lib/atoms/auth";
import { ThemeProvider } from "./theme-provider";

function AuthBootstrap() {
  const refresh = useSetAtom(refreshAuthAtom);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        forcedTheme="light"
        disableTransitionOnChange
      >
        <AuthBootstrap />
        {children}
        <Toaster richColors />
      </ThemeProvider>
    </Provider>
  );
}
