import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// DATABASE_URL is in .env.example. src/env.js will validate it later.
const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle({ client, schema });
