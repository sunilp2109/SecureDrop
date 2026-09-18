import { shareStore } from '../db/index.ts';
import { deleteCiphertext } from './blobStore.ts';

export async function purgeExpiredShares() {
  const now = new Date().toISOString();
  const rows = await shareStore.expiredIds(now);

  for (const share of rows) {
    const expired = Date.parse(share.expires_at) <= Date.now();
    const limitReached = share.download_count >= share.max_downloads;
    const revoked = Boolean(share.revoked_at);

    if (!expired && !limitReached && !revoked) continue;

    try {
      await deleteCiphertext(share.storage_path);
    } catch {
      // continue — metadata may still need removal
    }

    if (expired) {
      try {
        await shareStore.remove(share.id);
      } catch {
        console.error('cleanup_failed');
      }
    }
  }
}
