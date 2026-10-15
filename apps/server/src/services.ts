import { createDb } from "@fluke/db";
import { createEmailClient } from "@fluke/email";
import { createRedisClient } from "@fluke/redis";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const redis = createRedisClient(ENV);
export const email = createEmailClient(ENV);
