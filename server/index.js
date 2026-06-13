import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from './db/pool.js';
import { ensureDemoUser } from './db/seedUser.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import bootstrapRoutes from './routes/bootstrap.js';
import dataRoutes from './routes/data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// Health check (Railway)
app.get('/health', (_req, res) => res.json({ ok: true }));

const api = express.Router();
api.use('/auth', authRoutes);
api.use('/transactions', transactionRoutes);
api.use(bootstrapRoutes);
api.use(dataRoutes);
app.use('/api', api);

if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

async function start() {
  if (isProd) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error('[config] Defina JWT_SECRET com pelo menos 32 caracteres em produção');
      process.exit(1);
    }
    if (!process.env.DATABASE_URL) {
      console.error('[config] Defina DATABASE_URL (PostgreSQL) em produção');
      process.exit(1);
    }
  }

  const hasDb = await runMigrations();
  if (hasDb) await ensureDemoUser();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FinApp rodando em http://0.0.0.0:${PORT}${isProd ? ' (produção)' : ''}`);
    console.log(`[config] DB: ${hasDb ? 'PostgreSQL' : 'memória'}`);
    if (!hasDb) console.log('[db] Modo memória — defina DATABASE_URL para persistência real');
  });
}

start().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});
