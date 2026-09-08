import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const url = process.env.DATABASE_URL;
if (!url?.startsWith("file:"))
  throw new Error("Set DATABASE_URL to a local file: path before migrating.");
const sqlite = new Database(url.slice(5));
try {
  migrate(drizzle({ client: sqlite }), { migrationsFolder: "./drizzle" });
} finally {
  sqlite.close();
}
