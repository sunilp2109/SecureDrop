import { Router } from 'express';
import { shareStore } from '../db/index.ts';
import { deleteCiphertext } from '../services/blobStore.ts';
import { sendMail } from '../services/email.ts';
import { formatBytes, formatExpiry } from '../services/format.ts';
import { accessEmail } from '../templates/email.ts';
import { sha256Hex } from '../security/crypto.ts';
import { HttpError, optionalString } from '../security/validate.ts';
import { publicMetadata, shareStatus } from '../types.ts';
import { config } from '../config.ts';

export const manageRouter = Router();

async function loadManaged(token: string) {
  const share = await shareStore.findByManageHash(sha256Hex(token));
  if (!share) throw new HttpError(404, 'not_found', 'This security dashboard link is invalid.');
  return share;
}

manageRouter.get('/:token', async (req, res, next) => {
  try {
    const share = await loadManaged(String(req.params.token));
    res.json({
      id: share.id,
      status: shareStatus(share),
      recipientEmail: share.recipient_email,
      ...publicMetadata(share),
      sha256: share.ciphertext_sha256,
      revokedAt: share.revoked_at,
    });
  } catch (err) {
    next(err);
  }
});

manageRouter.post('/:token/revoke', async (req, res, next) => {
  try {
    const share = await loadManaged(String(req.params.token));
    if (share.revoked_at) {
      return res.json({ ok: true, status: 'revoked' });
    }
    await deleteCiphertext(share.storage_path);
    const updated = await shareStore.update(share.id, {
      revoked_at: new Date().toISOString(),
      download_grant_hash: null,
      download_grant_expires_at: null,
    });
    res.json({ ok: true, status: shareStatus(updated), revokedAt: updated.revoked_at });
  } catch (err) {
    next(err);
  }
});

manageRouter.post('/:token/resend-email', async (req, res, next) => {
  try {
    const manageToken = String(req.params.token);
    const share = await loadManaged(manageToken);
    if (shareStatus(share) !== 'ok') {
      throw new HttpError(409, 'unavailable', 'This drop can no longer be delivered.');
    }

    const accessToken = optionalString(req.body?.accessToken);
    if (!accessToken || sha256Hex(accessToken) !== share.access_token_hash) {
      throw new HttpError(400, 'invalid_access_token', 'The original access token is required to resend the link.');
    }

    const result = await sendMail({
      to: share.recipient_email,
      ...accessEmail({
        recipientEmail: share.recipient_email,
        fileName: share.original_filename,
        fileSizeLabel: formatBytes(share.size_bytes),
        expiresAtLabel: formatExpiry(share.expires_at),
        maxDownloads: share.max_downloads,
        passwordEnabled: share.password_enabled,
        otpEnabled: share.otp_enabled,
        accessUrl: `${config.appUrl}/access/${accessToken}`,
      }),
    });

    res.json({ ok: true, emailDelivered: result.delivered });
  } catch (err) {
    next(err);
  }
});
