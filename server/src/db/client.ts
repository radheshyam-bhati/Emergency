import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDirectory = path.resolve(process.cwd(), "server/data");
const databasePath = path.join(dataDirectory, "rapid-rescue.db");
const databaseWalPath = path.join(dataDirectory, "rapid-rescue.db-wal");
const databaseShmPath = path.join(dataDirectory, "rapid-rescue.db-shm");
const schemaPath = path.resolve(process.cwd(), "server/src/db/schema.sql");

let database: Database | null = null;

const ensureColumn = (
  activeDb: Database,
  tableName: string,
  columnName: string,
  columnDefinition: string,
) => {
  const columns = activeDb.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    activeDb.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
};

const runMigrations = (activeDb: Database) => {
  ensureColumn(activeDb, "dispatches", "pickup_eta_minutes", "INTEGER");
  ensureColumn(activeDb, "dispatches", "transport_eta_minutes", "INTEGER");
  ensureColumn(activeDb, "dispatches", "pickup_route_json", "TEXT");
  ensureColumn(activeDb, "dispatches", "hospital_route_json", "TEXT");
  ensureColumn(activeDb, "dispatches", "route_phase", "TEXT NOT NULL DEFAULT 'idle'");
  ensureColumn(activeDb, "dispatches", "route_progress", "REAL NOT NULL DEFAULT 0");
  ensureColumn(activeDb, "dispatches", "retry_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(activeDb, "dispatches", "last_retry_at", "TEXT");
  ensureColumn(activeDb, "dispatches", "escalated_at", "TEXT");
};

export const getDb = () => {
  if (database) {
    return database;
  }

  fs.mkdirSync(dataDirectory, { recursive: true });

  database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(fs.readFileSync(schemaPath, "utf8"));
  runMigrations(database);

  return database;
};

export const resetDb = () => {
  if (database) {
    database.close();
    database = null;
  }

  [databasePath, databaseWalPath, databaseShmPath].forEach((targetPath) => {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath);
    }
  });
};
