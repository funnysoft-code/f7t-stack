import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

import * as schema from "./schema";

// DATABASE_URL is in .env.example. src/env.js will validate it later.
const sqlite = new Database(process.env.DATABASE_URL!.replace(/^file:/, ""));

export const db = drizzle({ client: sqlite, schema });
