import { createSupabaseAdmin, SupabaseShareStore } from './supabaseStore.ts';
import { LocalShareStore } from './localStore.ts';
import { PostgresShareStore, createPgPool } from './postgresStore.ts';
import { usingPostgres, usingSupabase } from '../config.ts';
import type { ShareStore } from './store.ts';

export const supabaseAdmin = usingSupabase ? createSupabaseAdmin() : null;
export const pgPool = usingPostgres && !usingSupabase ? createPgPool() : null;

export const shareStore: ShareStore = usingSupabase && supabaseAdmin
  ? new SupabaseShareStore(supabaseAdmin)
  : pgPool
    ? new PostgresShareStore(pgPool)
    : new LocalShareStore();
