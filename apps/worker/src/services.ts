import { createDb } from "@fluke/db";
import { createEmailClient } from "@fluke/email";
import { createConnection } from "@fluke/queue";
import { ENV } from "./env.server";

export const db = createDb(ENV);
export const redis = createConnection(ENV);
export const resend = createEmailClient(ENV);
