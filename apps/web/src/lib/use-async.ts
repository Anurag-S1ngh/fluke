"use client";

import * as React from "react";

export function useAsync<T>(key: string, load: () => Promise<T>) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const loadRef = React.useRef(load);
  loadRef.current = load;
  const requestId = React.useRef(0);

  const reload = React.useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const value = await loadRef.current();
      if (id === requestId.current) {
        setData(value);
      }
      return value;
    } catch (err) {
      if (id === requestId.current) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
      return null;
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [key, reload]);

  return { data, error, loading, reload };
}
