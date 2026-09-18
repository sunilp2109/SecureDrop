import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.ts';
import type { ShareRecord } from '../types.ts';
import type { SharePatch, ShareStore } from './store.ts';

const filePath = path.join(config.dataDir, 'shares.json');

async function readAll(): Promise<ShareRecord[]> {
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as ShareRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return [];
    throw err;
  }
}

async function writeAll(rows: ShareRecord[]) {
  await mkdir(config.dataDir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(rows, null, 2), 'utf8');
  await writeFile(filePath, JSON.stringify(rows, null, 2), 'utf8');
}

export class LocalShareStore implements ShareStore {
  async create(share: ShareRecord): Promise<ShareRecord> {
    const rows = await readAll();
    rows.push(share);
    await writeAll(rows);
    return share;
  }

  async findByAccessHash(hash: string): Promise<ShareRecord | null> {
    return (await readAll()).find((row) => row.access_token_hash === hash) ?? null;
  }

  async findByManageHash(hash: string): Promise<ShareRecord | null> {
    return (await readAll()).find((row) => row.manage_token_hash === hash) ?? null;
  }

  async findByGrantHash(hash: string): Promise<ShareRecord | null> {
    return (await readAll()).find((row) => row.download_grant_hash === hash) ?? null;
  }

  async update(id: string, patch: SharePatch): Promise<ShareRecord> {
    const rows = await readAll();
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) throw new Error('share_not_found');
    const next = { ...rows[index], ...patch };
    rows[index] = next;
    await writeAll(rows);
    return next;
  }

  async expiredIds(nowIso: string): Promise<ShareRecord[]> {
    return (await readAll()).filter((row) => row.expires_at <= nowIso || row.revoked_at);
  }

  async remove(id: string): Promise<void> {
    const rows = (await readAll()).filter((row) => row.id !== id);
    await writeAll(rows);
  }
}
