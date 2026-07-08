import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'crm.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      website TEXT,
      industry TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      job_title TEXT,
      organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'lead' CHECK(status IN ('lead', 'qualified', 'customer')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
      contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
      stage TEXT NOT NULL DEFAULT 'new' CHECK(stage IN ('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
      value REAL NOT NULL DEFAULT 0,
      close_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('note', 'call', 'email')),
      contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE,
      deal_id TEXT REFERENCES deals(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT (datetime('now')),
      due_date TEXT,
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );


  `);
}

export function closeDb() {
  if (db) {
    db.close();
  }
}
