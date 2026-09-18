import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { config, usingPostgres, usingSmtp, usingSupabase } from './config.ts';
import { errorHandler, notFound } from './middleware/errorHandler.ts';
import {
  accessLimiter,
  createShareLimiter,
  downloadLimiter,
  globalLimiter,
  sensitiveLimiter,
} from './middleware/rateLimit.ts';
import { accessRouter } from './routes/access.ts';
import { manageRouter } from './routes/manage.ts';
import { sharesRouter } from './routes/shares.ts';
import { purgeExpiredShares } from './services/cleanup.ts';

await mkdir(config.dataDir, { recursive: true });
await mkdir(path.join(os.tmpdir(), 'securedrop'), { recursive: true });

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: config.appUrl,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
);
app.use(express.json({ limit: '32kb' }));
app.use(globalLimiter);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    database: usingSupabase || usingPostgres ? 'supabase' : 'local',
    storage: usingSupabase ? 'supabase' : 'local',
    email: usingSmtp ? 'smtp' : 'outbox',
  });
});

app.use('/api/shares', createShareLimiter, sharesRouter);
app.use('/api/access/download', downloadLimiter);
app.use('/api/access', accessLimiter);
app.use('/api/access/:token/verify-password', sensitiveLimiter);
app.use('/api/access/:token/request-otp', sensitiveLimiter);
app.use('/api/access/:token/verify-otp', sensitiveLimiter);
app.use('/api/access', accessRouter);
app.use('/api/manage', accessLimiter, manageRouter);

app.use(notFound);
app.use(errorHandler);

await purgeExpiredShares();
setInterval(() => {
  void purgeExpiredShares();
}, config.cleanupIntervalMs).unref();

app.listen(config.port, () => {
  console.log(`SecureDrop API listening on ${config.port}`);
});
