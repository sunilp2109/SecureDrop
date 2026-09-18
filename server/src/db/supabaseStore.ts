import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.ts';
import type { ShareRecord } from '../types.ts';
import type { SharePatch, ShareStore } from './store.ts';

export function createSupabaseAdmin(): SupabaseClient {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('Supabase is not configured');
  }
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export class SupabaseShareStore implements ShareStore {
  constructor(private readonly client: SupabaseClient) {}

  async create(share: ShareRecord): Promise<ShareRecord> {
    const { data, error } = await this.client.from('shares').insert(share).select('*').single();
    if (error) throw error;
    return data as ShareRecord;
  }

  async findByAccessHash(hash: string): Promise<ShareRecord | null> {
    const { data, error } = await this.client.from('shares').select('*').eq('access_token_hash', hash).maybeSingle();
    if (error) throw error;
    return (data as ShareRecord | null) ?? null;
  }

  async findByManageHash(hash: string): Promise<ShareRecord | null> {
    const { data, error } = await this.client.from('shares').select('*').eq('manage_token_hash', hash).maybeSingle();
    if (error) throw error;
    return (data as ShareRecord | null) ?? null;
  }

  async findByGrantHash(hash: string): Promise<ShareRecord | null> {
    const { data, error } = await this.client.from('shares').select('*').eq('download_grant_hash', hash).maybeSingle();
    if (error) throw error;
    return (data as ShareRecord | null) ?? null;
  }

  async update(id: string, patch: SharePatch): Promise<ShareRecord> {
    const { data, error } = await this.client.from('shares').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    return data as ShareRecord;
  }

  async expiredIds(nowIso: string): Promise<ShareRecord[]> {
    const { data, error } = await this.client
      .from('shares')
      .select('*')
      .or(`expires_at.lte.${nowIso},revoked_at.not.is.null`);
    if (error) throw error;
    return (data as ShareRecord[]) ?? [];
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('shares').delete().eq('id', id);
    if (error) throw error;
  }
}
