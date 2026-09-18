import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(root, '.env'), override: true });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
await client.query('create extension if not exists pgcrypto');
try {
  await client.query(
    `insert into storage.buckets (id, name, public) values ('securedrop', 'securedrop', false) on conflict (id) do nothing`,
  );
  console.log('bucket_ok');
} catch (error) {
  console.log('bucket_skipped', error instanceof Error ? error.message : 'unknown');
}
await client.end();
console.log('done');
