import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';

export function seedDatabase(db: Database.Database) {
  const orgCount = db.prepare('SELECT COUNT(*) as count FROM organizations').get() as { count: number };
  if (orgCount.count > 0) return; // Already seeded

  const organizations = [
    { id: uuidv4(), name: 'Acme Corporation', website: 'https://acme-corp.com', industry: 'Manufacturing', notes: 'Large manufacturing conglomerate with global operations.' },
    { id: uuidv4(), name: 'Globex Inc.', website: 'https://globex.io', industry: 'Technology', notes: 'Enterprise software company specializing in CRM solutions.' },
    { id: uuidv4(), name: 'Initech', website: 'https://initech.com', industry: 'Technology', notes: 'Mid-size tech company with growing market presence.' },
    { id: uuidv4(), name: 'Umbrella Corp', website: 'https://umbrella.bio', industry: 'Pharmaceuticals', notes: 'Research-focused pharmaceutical company.' },
    { id: uuidv4(), name: 'Stark Industries', website: 'https://starkindustries.com', industry: 'Defense', notes: 'Major defense contractor with diversified portfolio.' },
    { id: uuidv4(), name: 'Wayne Enterprises', website: 'https://wayneenterprises.com', industry: 'Conglomerate', notes: 'Diversified conglomerate with strong brand presence.' },
    { id: uuidv4(), name: 'Cyberdyne Systems', website: 'https://cyberdyne.com', industry: 'Technology', notes: 'AI and robotics research company.' },
  ];

  const insertOrg = db.prepare('INSERT INTO organizations (id, name, website, industry, notes) VALUES (?, ?, ?, ?, ?)');
  const orgIds: Record<string, string> = {};
  for (const org of organizations) {
    insertOrg.run(org.id, org.name, org.website, org.industry, org.notes);
    orgIds[org.name] = org.id;
  }

  const contacts = [
    { id: uuidv4(), name: 'John Smith', email: 'john.smith@acme-corp.com', phone: '+1-555-0101', job_title: 'VP of Sales', org: 'Acme Corporation', status: 'customer' },
    { id: uuidv4(), name: 'Jane Doe', email: 'jane.doe@globex.io', phone: '+1-555-0102', job_title: 'CTO', org: 'Globex Inc.', status: 'customer' },
    { id: uuidv4(), name: 'Bill Lumbergh', email: 'bill.lumbergh@initech.com', phone: '+1-555-0103', job_title: 'Director of Operations', org: 'Initech', status: 'qualified' },
    { id: uuidv4(), name: 'Alice Johnson', email: 'alice.johnson@umbrella.bio', phone: '+1-555-0104', job_title: 'Procurement Manager', org: 'Umbrella Corp', status: 'lead' },
    { id: uuidv4(), name: 'Tony Stark', email: 'tony@starkindustries.com', phone: '+1-555-0105', job_title: 'CEO', org: 'Stark Industries', status: 'customer' },
    { id: uuidv4(), name: 'Bruce Wayne', email: 'bruce@wayneenterprises.com', phone: '+1-555-0106', job_title: 'CEO', org: 'Wayne Enterprises', status: 'qualified' },
    { id: uuidv4(), name: 'Miles Dyson', email: 'miles@cyberdyne.com', phone: '+1-555-0107', job_title: 'Research Director', org: 'Cyberdyne Systems', status: 'lead' },
    { id: uuidv4(), name: 'Sarah Connor', email: 'sarah@cyberdyne.com', phone: '+1-555-0108', job_title: 'Security Consultant', org: 'Cyberdyne Systems', status: 'lead' },
    { id: uuidv4(), name: 'Peter Parker', email: 'peter@initech.com', phone: '+1-555-0109', job_title: 'Junior Developer', org: 'Initech', status: 'qualified' },
    { id: uuidv4(), name: 'Natasha Romanoff', email: 'natasha@starkindustries.com', phone: '+1-555-0110', job_title: 'Head of Security', org: 'Stark Industries', status: 'customer' },
  ];

  const insertContact = db.prepare('INSERT INTO contacts (id, name, email, phone, job_title, organization_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const contactIds: Record<string, string> = {};
  for (const c of contacts) {
    insertContact.run(c.id, c.name, c.email, c.phone, c.job_title, orgIds[c.org], c.status);
    contactIds[c.name] = c.id;
  }

  const deals = [
    { id: uuidv4(), name: 'Manufacturing Software Suite', org: 'Acme Corporation', contact: 'John Smith', stage: 'negotiation', value: 250000, closeDate: '2026-08-15' },
    { id: uuidv4(), name: 'Cloud Migration Package', org: 'Globex Inc.', contact: 'Jane Doe', stage: 'proposal', value: 180000, closeDate: '2026-09-01' },
    { id: uuidv4(), name: 'Office Automation System', org: 'Initech', contact: 'Bill Lumbergh', stage: 'qualified', value: 75000, closeDate: '2026-10-01' },
    { id: uuidv4(), name: 'Lab Management Platform', org: 'Umbrella Corp', contact: 'Alice Johnson', stage: 'new', value: 320000, closeDate: '2026-12-01' },
    { id: uuidv4(), name: 'Defense Analytics Engine', org: 'Stark Industries', contact: 'Tony Stark', stage: 'won', value: 950000, closeDate: '2026-06-30' },
    { id: uuidv4(), name: 'Security Infrastructure Upgrade', org: 'Wayne Enterprises', contact: 'Bruce Wayne', stage: 'negotiation', value: 420000, closeDate: '2026-08-01' },
    { id: uuidv4(), name: 'AI Research Platform', org: 'Cyberdyne Systems', contact: 'Miles Dyson', stage: 'proposal', value: 550000, closeDate: '2026-11-01' },
    { id: uuidv4(), name: 'Enterprise CRM Migration', org: 'Globex Inc.', contact: 'Jane Doe', stage: 'won', value: 310000, closeDate: '2026-05-15' },
    { id: uuidv4(), name: 'Network Security Audit', org: 'Stark Industries', contact: 'Natasha Romanoff', stage: 'qualified', value: 85000, closeDate: '2026-07-15' },
    { id: uuidv4(), name: 'Legacy System Modernization', org: 'Initech', contact: 'Peter Parker', stage: 'new', value: 120000, closeDate: '2026-09-15' },
    { id: uuidv4(), name: 'Supply Chain Optimizer', org: 'Acme Corporation', contact: 'John Smith', stage: 'lost', value: 200000, closeDate: '2026-04-01' },
    { id: uuidv4(), name: 'Quantum Computing Research', org: 'Cyberdyne Systems', contact: 'Sarah Connor', stage: 'new', value: 780000, closeDate: '2027-01-01' },
  ];

  const insertDeal = db.prepare('INSERT INTO deals (id, name, organization_id, contact_id, stage, value, close_date) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const d of deals) {
    insertDeal.run(d.id, d.name, orgIds[d.org], contactIds[d.contact], d.stage, d.value, d.closeDate);
  }

  const activities = [
    { type: 'note', contact: 'John Smith', deal: 'Manufacturing Software Suite', desc: 'Initial discovery call completed. John is interested in our manufacturing suite.', date: '2026-06-15 10:00:00' },
    { type: 'email', contact: 'Jane Doe', deal: 'Cloud Migration Package', desc: 'Sent proposal document for cloud migration. Awaiting feedback.', date: '2026-06-20 14:30:00', dueDate: '2026-07-05', done: 0 },
    { type: 'call', contact: 'Bill Lumbergh', deal: 'Office Automation System', desc: 'Left voicemail. Will follow up next week.', date: '2026-06-22 11:00:00', dueDate: '2026-06-29', done: 1 },
    { type: 'note', contact: 'Tony Stark', deal: 'Defense Analytics Engine', desc: 'Contract signed! Deal is won.', date: '2026-06-30 16:00:00' },
    { type: 'call', contact: 'Bruce Wayne', deal: 'Security Infrastructure Upgrade', desc: 'Discussed security requirements. Bruce wants a detailed proposal.', date: '2026-07-01 13:00:00', dueDate: '2026-07-08', done: 0 },
    { type: 'email', contact: 'Alice Johnson', deal: 'Lab Management Platform', desc: 'Sent introductory email about our lab management solution.', date: '2026-07-02 09:00:00', dueDate: '2026-07-09', done: 0 },
    { type: 'note', contact: 'Miles Dyson', deal: 'AI Research Platform', desc: 'Technical deep-dive on AI platform capabilities. Very interested.', date: '2026-07-03 15:00:00' },
  ];

  const insertActivity = db.prepare('INSERT INTO activities (id, type, contact_id, deal_id, description, date, due_date, done) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const a of activities) {
    insertActivity.run(uuidv4(), a.type, contactIds[a.contact], a.deal ? deals.find(d => d.name === a.deal)?.id || null : null, a.desc, a.date, a.dueDate || null, (a as any).done ?? 0);
  }
}
