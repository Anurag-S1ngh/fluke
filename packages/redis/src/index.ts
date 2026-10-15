import type { Redis } from "ioredis";
import RedisConstructor from "ioredis";

import type { RedisConfig } from "./config";

export function createRedisClient(env: RedisConfig): Redis {
  return new RedisConstructor(env.REDIS_URL, {
    enableReadyCheck: true,
    maxRetriesPerRequest: null,
  });
}

export type { RedisConfig } from "./config";
export type RedisClient = ReturnType<typeof createRedisClient>;

export async function set(
  client: Redis,
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<"OK" | null> {
  return ttlSeconds ? client.set(key, value, "EX", ttlSeconds) : client.set(key, value);
}

export async function get(client: Redis, key: string): Promise<string | null> {
  return client.get(key);
}

export async function del(client: Redis, ...keys: string[]): Promise<number> {
  return keys.length ? client.del(...keys) : 0;
}

export { RedisConstructor };
export default createRedisClient;