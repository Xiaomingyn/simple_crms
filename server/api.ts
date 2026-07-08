import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';

export function createApiRouter(db: Database.Database): Router {
  const router = Router();

  // ============ ORGANIZATIONS ============

  router.get('/organizations', (req: Request, res: Response) => {
    const search = req.query.search as string || '';
    let rows;
    if (search) {
      rows = db.prepare(
        `SELECT * FROM organizations WHERE name LIKE ? OR website LIKE ? OR industry LIKE ? ORDER BY name`
      ).all(`%${search}%`, `%${search}%`, `%${search}%`);
    } else {
      rows = db.prepare('SELECT * FROM organizations ORDER BY name').all();
    }
    res.json(rows);
  });

  router.get('/organizations/:id', (req: Request, res: Response) => {
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
    if (!org) return res.status(404).json({ error: 'Not found' });
    const contacts = db.prepare('SELECT * FROM contacts WHERE organization_id = ? ORDER BY name').all(req.params.id);
    const deals = db.prepare('SELECT d.*, c.name as contact_name FROM deals d LEFT JOIN contacts c ON d.contact_id = c.id WHERE d.organization_id = ? ORDER BY d.created_at DESC').all(req.params.id);
    res.json({ ...org as any, contacts, deals });
  });

  router.post('/organizations', (req: Request, res: Response) => {
    const { name, website, industry, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const id = uuidv4();
    db.prepare('INSERT INTO organizations (id, name, website, industry, notes) VALUES (?, ?, ?, ?, ?)').run(id, name, website || null, industry || null, notes || null);
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(id);
    res.status(201).json(org);
  });

  router.put('/organizations/:id', (req: Request, res: Response) => {
    const { name, website, industry, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    db.prepare('UPDATE organizations SET name = ?, website = ?, industry = ?, notes = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(name, website || null, industry || null, notes || null, req.params.id);
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
    res.json(org);
  });

  router.delete('/organizations/:id', (req: Request, res: Response) => {
    db.prepare('DELETE FROM organizations WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // ============ CONTACTS ============

  router.get('/contacts', (req: Request, res: Response) => {
    const search = req.query.search as string || '';
    const status = req.query.status as string || '';
    let query = 'SELECT c.*, o.name as organization_name FROM contacts c LEFT JOIN organizations o ON c.organization_id = o.id';
    const conditions: string[] = [];
    const params: string[] = [];

    if (search) {
      conditions.push('(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY c.name';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  });

  router.get('/contacts/:id', (req: Request, res: Response) => {
    const contact = db.prepare(
      'SELECT c.*, o.name as organization_name FROM contacts c LEFT JOIN organizations o ON c.organization_id = o.id WHERE c.id = ?'
    ).get(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Not found' });
    const activities = db.prepare(
      'SELECT a.*, d.name as deal_name FROM activities a LEFT JOIN deals d ON a.deal_id = d.id WHERE a.contact_id = ? ORDER BY a.date DESC'
    ).all(req.params.id);
    const deals = db.prepare(
      'SELECT d.*, o.name as organization_name FROM deals d LEFT JOIN organizations o ON d.organization_id = o.id WHERE d.contact_id = ? ORDER BY d.created_at DESC'
    ).all(req.params.id);
    res.json({ ...contact as any, activities, deals });
  });

  router.post('/contacts', (req: Request, res: Response) => {
    const { name, email, phone, job_title, organization_id, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const id = uuidv4();
    db.prepare('INSERT INTO contacts (id, name, email, phone, job_title, organization_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, email || null, phone || null, job_title || null, organization_id || null, status || 'lead');
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    res.status(201).json(contact);
  });

  router.put('/contacts/:id', (req: Request, res: Response) => {
    const { name, email, phone, job_title, organization_id, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    db.prepare(
      'UPDATE contacts SET name = ?, email = ?, phone = ?, job_title = ?, organization_id = ?, status = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(name, email || null, phone || null, job_title || null, organization_id || null, status || 'lead', req.params.id);
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    res.json(contact);
  });

  router.delete('/contacts/:id', (req: Request, res: Response) => {
    db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // ============ DEALS ============

  router.get('/deals', (req: Request, res: Response) => {
    const search = req.query.search as string || '';
    let query = `SELECT d.*, o.name as organization_name, c.name as contact_name 
      FROM deals d 
      LEFT JOIN organizations o ON d.organization_id = o.id 
      LEFT JOIN contacts c ON d.contact_id = c.id`;
    const params: string[] = [];
    if (search) {
      query += ' WHERE d.name LIKE ? OR o.name LIKE ? OR c.name LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY d.created_at DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  });

  router.get('/deals/stages', (req: Request, res: Response) => {
    const rows = db.prepare(
      `SELECT d.*, o.name as organization_name, c.name as contact_name 
      FROM deals d 
      LEFT JOIN organizations o ON d.organization_id = o.id 
      LEFT JOIN contacts c ON d.contact_id = c.id 
      ORDER BY d.created_at DESC`
    ).all();
    
    const stages = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    const grouped: Record<string, any[]> = {};
    for (const stage of stages) {
      grouped[stage] = [];
    }
    for (const row of rows as any[]) {
      if (grouped[row.stage]) {
        grouped[row.stage].push(row);
      }
    }
    res.json(grouped);
  });

  router.get('/deals/:id', (req: Request, res: Response) => {
    const deal = db.prepare(
      `SELECT d.*, o.name as organization_name, o.industry as organization_industry, 
       c.name as contact_name, c.email as contact_email, c.phone as contact_phone 
       FROM deals d 
       LEFT JOIN organizations o ON d.organization_id = o.id 
       LEFT JOIN contacts c ON d.contact_id = c.id 
       WHERE d.id = ?`
    ).get(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Not found' });
    const activities = db.prepare(
      'SELECT a.*, c.name as contact_name FROM activities a LEFT JOIN contacts c ON a.contact_id = c.id WHERE a.deal_id = ? ORDER BY a.date DESC'
    ).all(req.params.id);
    res.json({ ...deal as any, activities });
  });

  router.post('/deals', (req: Request, res: Response) => {
    const { name, organization_id, contact_id, stage, value, close_date } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const id = uuidv4();
    db.prepare('INSERT INTO deals (id, name, organization_id, contact_id, stage, value, close_date) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, organization_id || null, contact_id || null, stage || 'new', value || 0, close_date || null);
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(id);
    res.status(201).json(deal);
  });

  router.put('/deals/:id', (req: Request, res: Response) => {
    const { name, organization_id, contact_id, stage, value, close_date } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    db.prepare(
      'UPDATE deals SET name = ?, organization_id = ?, contact_id = ?, stage = ?, value = ?, close_date = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(name, organization_id || null, contact_id || null, stage || 'new', value || 0, close_date || null, req.params.id);
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
    res.json(deal);
  });

  router.patch('/deals/:id/stage', (req: Request, res: Response) => {
    const { stage } = req.body;
    const validStages = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    if (!validStages.includes(stage)) return res.status(400).json({ error: 'Invalid stage' });
    db.prepare('UPDATE deals SET stage = ?, updated_at = datetime(\'now\') WHERE id = ?').run(stage, req.params.id);
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
    res.json(deal);
  });

  router.delete('/deals/:id', (req: Request, res: Response) => {
    db.prepare('DELETE FROM deals WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // ============ ACTIVITIES ============

  router.get('/activities', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const rows = db.prepare(
      `SELECT a.*, c.name as contact_name, d.name as deal_name 
       FROM activities a 
       LEFT JOIN contacts c ON a.contact_id = c.id 
       LEFT JOIN deals d ON a.deal_id = d.id 
       ORDER BY a.date DESC LIMIT ?`
    ).all(limit);
    res.json(rows);
  });

  router.get('/activities/tasks', (req: Request, res: Response) => {
    const rows = db.prepare(
      `SELECT a.*, c.name as contact_name, d.name as deal_name 
       FROM activities a 
       LEFT JOIN contacts c ON a.contact_id = c.id 
       LEFT JOIN deals d ON a.deal_id = d.id 
       WHERE a.due_date IS NOT NULL AND a.done = 0 
       ORDER BY a.due_date ASC`
    ).all();
    res.json(rows);
  });

  router.post('/activities', (req: Request, res: Response) => {
    const { type, contact_id, deal_id, description, date, due_date, done } = req.body;
    if (!type || !description) return res.status(400).json({ error: 'Type and description are required' });
    const id = uuidv4();
    db.prepare('INSERT INTO activities (id, type, contact_id, deal_id, description, date, due_date, done) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, type, contact_id || null, deal_id || null, description, date || new Date().toISOString(), due_date || null, done ? 1 : 0);
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
    res.status(201).json(activity);
  });

  router.patch('/activities/:id/toggle', (req: Request, res: Response) => {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id) as any;
    if (!activity) return res.status(404).json({ error: 'Not found' });
    const newDone = activity.done ? 0 : 1;
    db.prepare('UPDATE activities SET done = ? WHERE id = ?').run(newDone, req.params.id);
    const updated = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
    res.json(updated);
  });

  // ============ DASHBOARD ============

  router.get('/dashboard', (req: Request, res: Response) => {
    // Won deals per month (last 12 months)
    const wonByMonth = db.prepare(`
      SELECT strftime('%Y-%m', close_date) as month, COUNT(*) as count, SUM(value) as revenue
      FROM deals WHERE stage = 'won' AND close_date >= date('now', '-12 months')
      GROUP BY month ORDER BY month
    `).all();

    // Recent activity
    const recentActivity = db.prepare(
      `SELECT a.*, c.name as contact_name, d.name as deal_name 
       FROM activities a 
       LEFT JOIN contacts c ON a.contact_id = c.id 
       LEFT JOIN deals d ON a.deal_id = d.id 
       ORDER BY a.date DESC LIMIT 10`
    ).all();

    // Upcoming/overdue tasks
    const tasks = db.prepare(
      `SELECT a.*, c.name as contact_name, d.name as deal_name 
       FROM activities a 
       LEFT JOIN contacts c ON a.contact_id = c.id 
       LEFT JOIN deals d ON a.deal_id = d.id 
       WHERE a.due_date IS NOT NULL AND a.done = 0 
       ORDER BY a.due_date ASC`
    ).all();

    // Summary stats
    const totalDeals = (db.prepare('SELECT COUNT(*) as count FROM deals').get() as any).count;
    const wonDeals = (db.prepare('SELECT COUNT(*) as count FROM deals WHERE stage = \'won\'').get() as any).count;
    const totalRevenue = (db.prepare('SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE stage = \'won\'').get() as any).total;
    const activeDeals = (db.prepare('SELECT COUNT(*) as count FROM deals WHERE stage NOT IN (\'won\', \'lost\')').get() as any).count;

    res.json({
      wonByMonth,
      recentActivity,
      tasks,
      summary: { totalDeals, wonDeals, totalRevenue, activeDeals }
    });
  });

  return router;
}
