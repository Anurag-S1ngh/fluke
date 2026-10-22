const BASE_URL = `${process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000"}/api/v1`;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = (await res.json().catch(() => null)) as { error?: string } | null;

  if (!res.ok) {
    throw new ApiError(data?.error ?? "Something went wrong", res.status);
  }

  return data as T;
}
