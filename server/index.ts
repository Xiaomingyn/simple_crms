import express from 'express';
import cors from 'cors';
import { getDb, closeDb } from './db.js';
import { createApiRouter } from './api.js';
import { seedDatabase } from './seed.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = getDb();
seedDatabase(db);

app.use('/api', createApiRouter(db));

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`CRM API server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  closeDb();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  server.close();
  process.exit(0);
});
