import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

// Run migrations
const dbPath = path.join(process.cwd(), "local.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

console.log("Running migrations...");

migrate(db, {
  migrationsFolder: path.join(process.cwd(), "drizzle/migrations"),
});

console.log("Migrations complete!");

sqlite.close();
