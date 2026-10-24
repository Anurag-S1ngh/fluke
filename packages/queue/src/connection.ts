import { createRedisClient, type RedisClient, type RedisConfig } from "@fluke/redis";

/**
 * Every Queue and Worker needs its own connection: BullMQ blocks the worker
 * connection on `BRPOPLPUSH`, and `maxRetriesPerRequest` must be null for that.
 * `createRedisClient` already sets the required retry behaviour.
 */
export const createConnection = (env: RedisConfig): RedisClient => createRedisClient(env);

export type QueueConnection = RedisClient;
