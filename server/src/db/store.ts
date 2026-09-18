import type { ShareRecord } from '../types.ts';

export type SharePatch = Partial<ShareRecord>;

export interface ShareStore {
  create(share: ShareRecord): Promise<ShareRecord>;
  findByAccessHash(hash: string): Promise<ShareRecord | null>;
  findByManageHash(hash: string): Promise<ShareRecord | null>;
  findByGrantHash(hash: string): Promise<ShareRecord | null>;
  update(id: string, patch: SharePatch): Promise<ShareRecord>;
  expiredIds(nowIso: string): Promise<ShareRecord[]>;
  remove(id: string): Promise<void>;
}
