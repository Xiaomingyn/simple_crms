import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

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

  return db;
}

export function seedTestData(db: Database.Database) {
  const orgId = uuidv4();
  db.prepare('INSERT INTO organizations (id, name, website, industry, notes) VALUES (?, ?, ?, ?, ?)')
    .run(orgId, 'Test Corp', 'https://testcorp.com', 'Technology', 'A test organization');

  const contactId = uuidv4();
  db.prepare('INSERT INTO contacts (id, name, email, phone, job_title, organization_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(contactId, 'John Doe', 'john@testcorp.com', '+1-555-0001', 'CEO', orgId, 'lead');

  const dealId = uuidv4();
  db.prepare('INSERT INTO deals (id, name, organization_id, contact_id, stage, value, close_date) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(dealId, 'Big Deal', orgId, contactId, 'new', 50000, '2026-12-31');

  return { orgId, contactId, dealId };
}
