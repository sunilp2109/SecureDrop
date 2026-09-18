import { createReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { config, usingSupabase } from '../config.ts';
import { supabaseAdmin } from '../db/index.ts';

export async function putCiphertext(storagePath: string, tempFilePath: string): Promise<void> {
  if (usingSupabase && supabaseAdmin) {
    const { readFile } = await import('node:fs/promises');
    const bytes = await readFile(tempFilePath);
    const { error } = await supabaseAdmin.storage.from(config.supabaseBucket).upload(storagePath, bytes, {
      contentType: 'application/octet-stream',
      upsert: false,
    });
    if (error) throw error;
    return;
  }

  const full = path.join(config.dataDir, 'files', storagePath);
  await mkdir(path.dirname(full), { recursive: true });
  const bytes = await (await import('node:fs/promises')).readFile(tempFilePath);
  await writeFile(full, bytes);
}

export function getCiphertextStream(storagePath: string): Readable {
  if (usingSupabase && supabaseAdmin) {
    throw new Error('use_signed_download');
  }
  return createReadStream(path.join(config.dataDir, 'files', storagePath));
}

export async function getCiphertextBuffer(storagePath: string): Promise<Buffer> {
  if (usingSupabase && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.storage.from(config.supabaseBucket).download(storagePath);
    if (error || !data) throw error ?? new Error('missing_object');
    return Buffer.from(await data.arrayBuffer());
  }
  const { readFile } = await import('node:fs/promises');
  return readFile(path.join(config.dataDir, 'files', storagePath));
}

export async function deleteCiphertext(storagePath: string): Promise<void> {
  if (usingSupabase && supabaseAdmin) {
    await supabaseAdmin.storage.from(config.supabaseBucket).remove([storagePath]);
    return;
  }
  try {
    await unlink(path.join(config.dataDir, 'files', storagePath));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}

export async function removeTemp(filePath: string | undefined) {
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch {
    // temp file already gone
  }
}
