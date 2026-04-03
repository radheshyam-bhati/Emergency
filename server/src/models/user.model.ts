import { getDb } from "../db/client.js";
import { mapUser, type UserRecord, type UserRow } from "../utils/mappers.js";

export const userModel = {
  findByEmail(email: string) {
    const row = getDb().prepare<UserRow>("SELECT * FROM users WHERE email = ?").get(email);
    return row ? { ...mapUser(row), passwordHash: row.password_hash as string } : null;
  },

  findById(id: number): UserRecord | null {
    const row = getDb().prepare<UserRow>("SELECT * FROM users WHERE id = ?").get(id);
    return row ? mapUser(row) : null;
  },

  create(email: string, passwordHash: string, fullName: string, role: string): UserRecord {
    const db = getDb();
    const result = db
      .prepare(
        "INSERT INTO users (email, password_hash, full_name, role, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
      )
      .run(email, passwordHash, fullName, role);
    return this.findById(result.lastInsertRowid as number)!;
  },
};
