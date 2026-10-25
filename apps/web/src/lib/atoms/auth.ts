"use client";

import { atom, useAtomValue, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { Me } from "@/lib/types";

export const userAtom = atom<Me | null>(null);
export const authLoadingAtom = atom(true);

export const refreshAuthAtom = atom(null, async (_get, set) => {
  try {
    set(userAtom, await api<Me>("/auth/me"));
  } catch {
    set(userAtom, null);
  } finally {
    set(authLoadingAtom, false);
  }
});

export const updateBalanceAtom = atom(null, (_get, set, balance: number) => {
  set(userAtom, (current) => (current ? { ...current, balance } : current));
});

export const clearUserAtom = atom(null, (_get, set) => {
  set(userAtom, null);
});

export function useAuth() {
  const user = useAtomValue(userAtom);
  const loading = useAtomValue(authLoadingAtom);
  const refresh = useSetAtom(refreshAuthAtom);
  const updateBalance = useSetAtom(updateBalanceAtom);
  const clearUser = useSetAtom(clearUserAtom);
  const router = useRouter();

  const signOut = React.useCallback(async () => {
    try {
      await api("/auth/signout", { method: "POST" });
    } catch {
      // The session may already be gone; drop local state either way.
    }
    clearUser();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }, [clearUser, router]);

  return { user, loading, refresh, updateBalance, signOut };
}
