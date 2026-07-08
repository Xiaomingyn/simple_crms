import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { createTestDb, seedTestData } from './helpers';

let db: Database.Database;

beforeEach(() => {
  db = createTestDb();
});

// ============ ORGANIZATIONS ============

describe('Organizations CRUD', () => {
  it('should create an organization', () => {
    const id = uuidv4();
    db.prepare('INSERT INTO organizations (id, name, website, industry, notes) VALUES (?, ?, ?, ?, ?)')
      .run(id, 'New Org', 'https://neworg.com', 'Finance', 'Some notes');
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(id) as any;
    expect(org).toBeDefined();
    expect(org.name).toBe('New Org');
    expect(org.industry).toBe('Finance');
  });

  it('should read all organizations', () => {
    seedTestData(db);
    const orgs = db.prepare('SELECT * FROM organizations').all();
    expect(orgs.length).toBeGreaterThanOrEqual(1);
  });

  it('should update an organization', () => {
    const { orgId } = seedTestData(db);
    db.prepare('UPDATE organizations SET name = ?, industry = ? WHERE id = ?')
      .run('Updated Corp', 'Healthcare', orgId);
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId) as any;
    expect(org.name).toBe('Updated Corp');
    expect(org.industry).toBe('Healthcare');
  });

  it('should delete an organization', () => {
    const { orgId } = seedTestData(db);
    db.prepare('DELETE FROM organizations WHERE id = ?').run(orgId);
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
    expect(org).toBeUndefined();
  });

  it('should search organizations by name', () => {
    seedTestData(db);
    const results = db.prepare('SELECT * FROM organizations WHERE name LIKE ?').all('%Test%');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});

// ============ CONTACTS ============

describe('Contacts CRUD', () => {
  it('should create a contact', () => {
    const id = uuidv4();
    db.prepare('INSERT INTO contacts (id, name, email, phone, job_title, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, 'Jane Smith', 'jane@example.com', '+1-555-0002', 'Manager', 'qualified');
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as any;
    expect(contact).toBeDefined();
    expect(contact.name).toBe('Jane Smith');
    expect(contact.status).toBe('qualified');
  });

  it('should read all contacts', () => {
    seedTestData(db);
    const contacts = db.prepare('SELECT * FROM contacts').all();
    expect(contacts.length).toBeGreaterThanOrEqual(1);
  });

  it('should update a contact', () => {
    const { contactId } = seedTestData(db);
    db.prepare('UPDATE contacts SET name = ?, status = ? WHERE id = ?')
      .run('Jane Updated', 'customer', contactId);
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId) as any;
    expect(contact.name).toBe('Jane Updated');
    expect(contact.status).toBe('customer');
  });

  it('should delete a contact', () => {
    const { contactId } = seedTestData(db);
    db.prepare('DELETE FROM contacts WHERE id = ?').run(contactId);
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId);
    expect(contact).toBeUndefined();
  });

  it('should search contacts by email', () => {
    seedTestData(db);
    const results = db.prepare('SELECT * FROM contacts WHERE email LIKE ?').all('%john@testcorp.com%');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('should filter contacts by status', () => {
    seedTestData(db);
    const results = db.prepare('SELECT * FROM contacts WHERE status = ?').all('lead');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});

// ============ DEALS ============

describe('Deals CRUD', () => {
  it('should create a deal', () => {
    const id = uuidv4();
    db.prepare('INSERT INTO deals (id, name, stage, value, close_date) VALUES (?, ?, ?, ?, ?)')
      .run(id, 'New Deal', 'qualified', 100000, '2026-10-01');
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(id) as any;
    expect(deal).toBeDefined();
    expect(deal.name).toBe('New Deal');
    expect(deal.stage).toBe('qualified');
  });

  it('should read all deals', () => {
    seedTestData(db);
    const deals = db.prepare('SELECT * FROM deals').all();
    expect(deals.length).toBeGreaterThanOrEqual(1);
  });

  it('should update a deal', () => {
    const { dealId } = seedTestData(db);
    db.prepare('UPDATE deals SET name = ?, stage = ?, value = ? WHERE id = ?')
      .run('Updated Deal', 'negotiation', 75000, dealId);
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(dealId) as any;
    expect(deal.name).toBe('Updated Deal');
    expect(deal.stage).toBe('negotiation');
    expect(deal.value).toBe(75000);
  });

  it('should delete a deal', () => {
    const { dealId } = seedTestData(db);
    db.prepare('DELETE FROM deals WHERE id = ?').run(dealId);
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(dealId);
    expect(deal).toBeUndefined();
  });

  it('should change deal stage to won', () => {
    const { dealId } = seedTestData(db);
    db.prepare('UPDATE deals SET stage = ? WHERE id = ?').run('won', dealId);
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(dealId) as any;
    expect(deal.stage).toBe('won');
  });

  it('should change deal stage to lost', () => {
    const { dealId } = seedTestData(db);
    db.prepare('UPDATE deals SET stage = ? WHERE id = ?').run('lost', dealId);
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(dealId) as any;
    expect(deal.stage).toBe('lost');
  });
});

// ============ ACTIVITIES ============

describe('Activities CRUD', () => {
  it('should create a note activity', () => {
    const id = uuidv4();
    db.prepare('INSERT INTO activities (id, type, description, date) VALUES (?, ?, ?, datetime(\'now\'))')
      .run(id, 'note', 'Test note');
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as any;
    expect(activity).toBeDefined();
    expect(activity.type).toBe('note');
    expect(activity.description).toBe('Test note');
    expect(activity.done).toBe(0);
  });

  it('should create a call activity', () => {
    const id = uuidv4();
    db.prepare('INSERT INTO activities (id, type, description) VALUES (?, ?, ?)')
      .run(id, 'call', 'Phone call with client');
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as any;
    expect(activity.type).toBe('call');
  });

  it('should create an email activity', () => {
    const id = uuidv4();
    db.prepare('INSERT INTO activities (id, type, description, due_date) VALUES (?, ?, ?, ?)')
      .run(id, 'email', 'Sent proposal', '2026-08-01');
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as any;
    expect(activity.type).toBe('email');
    expect(activity.due_date).toBe('2026-08-01');
  });

  it('should toggle activity done status', () => {
    const { contactId } = seedTestData(db);
    const actId = uuidv4();
    db.prepare('INSERT INTO activities (id, type, contact_id, description, done) VALUES (?, ?, ?, ?, ?)')
      .run(actId, 'note', contactId, 'Task to do', 0);
    
    let activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(actId) as any;
    expect(activity.done).toBe(0);
    
    db.prepare('UPDATE activities SET done = ? WHERE id = ?').run(1, actId);
    activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(actId) as any;
    expect(activity.done).toBe(1);
    
    db.prepare('UPDATE activities SET done = ? WHERE id = ?').run(0, actId);
    activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(actId) as any;
    expect(activity.done).toBe(0);
  });

  it('should list activities for a contact', () => {
    const { contactId } = seedTestData(db);
    db.prepare('INSERT INTO activities (id, type, contact_id, description) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), 'note', contactId, 'Activity 1');
    db.prepare('INSERT INTO activities (id, type, contact_id, description) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), 'call', contactId, 'Activity 2');
    
    const activities = db.prepare('SELECT * FROM activities WHERE contact_id = ? ORDER BY date DESC').all(contactId);
    expect(activities.length).toBe(2);
  });
});
