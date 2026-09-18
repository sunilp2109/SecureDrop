import pg from 'pg';
import { config } from '../config.ts';
import type { ShareRecord } from '../types.ts';
import type { SharePatch, ShareStore } from './store.ts';

const { Pool } = pg;

function iso(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapRow(row: Record<string, unknown>): ShareRecord {
  return {
    id: String(row.id),
    access_token_hash: String(row.access_token_hash),
    manage_token_hash: String(row.manage_token_hash),
    recipient_email: String(row.recipient_email),
    original_filename: String(row.original_filename),
    mime_type: row.mime_type == null ? null : String(row.mime_type),
    size_bytes: Number(row.size_bytes),
    storage_path: String(row.storage_path),
    ciphertext_sha256: String(row.ciphertext_sha256),
    iv: String(row.iv),
    wrapped_dek: row.wrapped_dek == null ? null : String(row.wrapped_dek),
    kdf_salt: row.kdf_salt == null ? null : String(row.kdf_salt),
    kdf_iterations: row.kdf_iterations == null ? null : Number(row.kdf_iterations),
    password_enabled: Boolean(row.password_enabled),
    password_salt: row.password_salt == null ? null : String(row.password_salt),
    password_hash: row.password_hash == null ? null : String(row.password_hash),
    otp_enabled: Boolean(row.otp_enabled),
    otp_hash: row.otp_hash == null ? null : String(row.otp_hash),
    otp_salt: row.otp_salt == null ? null : String(row.otp_salt),
    otp_expires_at: iso(row.otp_expires_at),
    otp_attempts: Number(row.otp_attempts ?? 0),
    max_downloads: Number(row.max_downloads),
    download_count: Number(row.download_count ?? 0),
    expires_at: iso(row.expires_at) ?? '',
    revoked_at: iso(row.revoked_at),
    download_grant_hash: row.download_grant_hash == null ? null : String(row.download_grant_hash),
    download_grant_expires_at: iso(row.download_grant_expires_at),
    password_verified_until: iso(row.password_verified_until),
    created_at: iso(row.created_at) ?? '',
    last_accessed_at: iso(row.last_accessed_at),
  };
}

export function createPgPool() {
  if (!config.databaseUrl) throw new Error('DATABASE_URL is not configured');
  return new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 8,
  });
}

export class PostgresShareStore implements ShareStore {
  constructor(private readonly pool: pg.Pool) {}

  async create(share: ShareRecord): Promise<ShareRecord> {
    const { rows } = await this.pool.query(
      `insert into public.shares (
        id, access_token_hash, manage_token_hash, recipient_email, original_filename, mime_type,
        size_bytes, storage_path, ciphertext_sha256, iv, wrapped_dek, kdf_salt, kdf_iterations,
        password_enabled, password_salt, password_hash, otp_enabled, otp_hash, otp_salt, otp_expires_at,
        otp_attempts, max_downloads, download_count, expires_at, revoked_at, download_grant_hash,
        download_grant_expires_at, password_verified_until, created_at, last_accessed_at
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30
      ) returning *`,
      [
        share.id,
        share.access_token_hash,
        share.manage_token_hash,
        share.recipient_email,
        share.original_filename,
        share.mime_type,
        share.size_bytes,
        share.storage_path,
        share.ciphertext_sha256,
        share.iv,
        share.wrapped_dek,
        share.kdf_salt,
        share.kdf_iterations,
        share.password_enabled,
        share.password_salt,
        share.password_hash,
        share.otp_enabled,
        share.otp_hash,
        share.otp_salt,
        share.otp_expires_at,
        share.otp_attempts,
        share.max_downloads,
        share.download_count,
        share.expires_at,
        share.revoked_at,
        share.download_grant_hash,
        share.download_grant_expires_at,
        share.password_verified_until,
        share.created_at,
        share.last_accessed_at,
      ],
    );
    return mapRow(rows[0] as Record<string, unknown>);
  }

  async findByAccessHash(hash: string): Promise<ShareRecord | null> {
    const { rows } = await this.pool.query('select * from public.shares where access_token_hash = $1 limit 1', [hash]);
    return rows[0] ? mapRow(rows[0] as Record<string, unknown>) : null;
  }

  async findByManageHash(hash: string): Promise<ShareRecord | null> {
    const { rows } = await this.pool.query('select * from public.shares where manage_token_hash = $1 limit 1', [hash]);
    return rows[0] ? mapRow(rows[0] as Record<string, unknown>) : null;
  }

  async findByGrantHash(hash: string): Promise<ShareRecord | null> {
    const { rows } = await this.pool.query('select * from public.shares where download_grant_hash = $1 limit 1', [hash]);
    return rows[0] ? mapRow(rows[0] as Record<string, unknown>) : null;
  }

  async update(id: string, patch: SharePatch): Promise<ShareRecord> {
    const entries = Object.entries(patch).filter(([, value]) => value !== undefined);
    if (entries.length === 0) {
      const current = await this.pool.query('select * from public.shares where id = $1', [id]);
      if (!current.rows[0]) throw new Error('share_not_found');
      return mapRow(current.rows[0] as Record<string, unknown>);
    }
    const assignments = entries.map(([key], index) => `${key} = $${index + 2}`);
    const values = entries.map(([, value]) => value);
    const { rows } = await this.pool.query(
      `update public.shares set ${assignments.join(', ')} where id = $1 returning *`,
      [id, ...values],
    );
    if (!rows[0]) throw new Error('share_not_found');
    return mapRow(rows[0] as Record<string, unknown>);
  }

  async expiredIds(nowIso: string): Promise<ShareRecord[]> {
    const { rows } = await this.pool.query(
      `select * from public.shares
       where expires_at <= $1::timestamptz
          or revoked_at is not null
          or download_count >= max_downloads`,
      [nowIso],
    );
    return rows.map((row) => mapRow(row as Record<string, unknown>));
  }

  async remove(id: string): Promise<void> {
    await this.pool.query('delete from public.shares where id = $1', [id]);
  }
}
