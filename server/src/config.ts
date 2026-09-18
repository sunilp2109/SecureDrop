import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');

dotenv.config({ path: path.join(repoRoot, '.env'), override: true });

function integer(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: (process.env.NODE_ENV ?? 'development') === 'production',
  port: integer('PORT', 3001),
  appUrl: (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, ''),
  supabaseUrl: optional('SUPABASE_URL'),
  supabaseServiceRoleKey: optional('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'securedrop',
  databaseUrl: optional('DATABASE_URL'),
  smtpHost: optional('SMTP_HOST'),
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: optional('SMTP_USER'),
  smtpPass: optional('SMTP_PASS'),
  smtpFrom: process.env.SMTP_FROM ?? 'SecureDrop <noreply@localhost>',
  maxUploadBytes: integer('MAX_UPLOAD_BYTES', 52_428_800),
  cleanupIntervalMs: integer('CLEANUP_INTERVAL_MS', 60_000),
  otpTtlMs: integer('OTP_TTL_MS', 600_000),
  downloadGrantTtlMs: integer('DOWNLOAD_GRANT_TTL_MS', 120_000),
  pbkdf2Iterations: integer('PBKDF2_ITERATIONS', 210_000),
  dataDir: path.join(repoRoot, 'server', 'data'),
  repoRoot,
};

export const usingSupabase = Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
export const usingPostgres = Boolean(config.databaseUrl);
export const usingSmtp = Boolean(config.smtpHost && config.smtpUser && config.smtpPass);
