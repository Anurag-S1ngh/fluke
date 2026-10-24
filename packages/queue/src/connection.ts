import { createRedisClient, type RedisClient, type RedisConfig } from "@fluke/redis";

export const createConnection = (env: RedisConfig): RedisClient => createRedisClient(env);

export type QueueConnection = RedisClient;
