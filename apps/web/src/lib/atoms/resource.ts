"use client";

import { atom, useAtomValue, useSetAtom, type Atom } from "jotai";
import { atomFamily } from "jotai-family";
import { atomWithRefresh, unwrap } from "jotai/utils";
import * as React from "react";

const LOADING = Symbol("loading");
const CACHE_TTL_MS = 30 * 60 * 1000;

type Loadable<T> =
  | { state: "loading" }
  | { state: "hasData"; data: T }
  | { state: "hasError"; error: string };

const loadable = <T>(asyncAtom: Atom<Promise<T>>): Atom<Loadable<T>> => {
  const unwrapped = unwrap(asyncAtom, () => LOADING);
  return atom<Loadable<T>>((get) => {
    try {
      const data = get(unwrapped) as T | typeof LOADING;
      if (data === LOADING) {
        return { state: "loading" };
      }
      return { state: "hasData", data: data as T };
    } catch (error) {
      return {
        state: "hasError",
        error: error instanceof Error ? error.message : "Something went wrong",
      };
    }
  });
};

export interface Resource<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

export function createResource<K, T>(
  load: (key: K) => Promise<T>,
  areEqual?: (a: K, b: K) => boolean,
) {
  const source = atomFamily((key: K) => atomWithRefresh(() => load(key)), areEqual);
  const view = atomFamily((key: K) => loadable(source(key)), areEqual);
  const isStale = (createdAt: number) => Date.now() - createdAt > CACHE_TTL_MS;

  source.setShouldRemove(isStale);
  view.setShouldRemove(isStale);

  return function useResource(key: K): Resource<T> {
    const state = useAtomValue(view(key));
    const refresh = useSetAtom(source(key));
    const reload = React.useCallback(() => {
      refresh();
    }, [refresh]);

    return {
      data: state.state === "hasData" ? state.data : null,
      error: state.state === "hasError" ? state.error : null,
      loading: state.state === "loading",
      reload,
    };
  };
}
