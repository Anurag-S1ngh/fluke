import { createDb } from "@fluke/db";
import { createRedisClient } from "@fluke/redis";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const redis = createRedisClient(ENV);
