import { createDb } from "@fluke/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
