import { Router } from 'express';
import { createHash } from 'node:crypto';
import { config } from '../config.ts';
import { shareStore } from '../db/index.ts';
import { deleteCiphertext, getCiphertextBuffer } from '../services/blobStore.ts';
import { sendMail } from '../services/email.ts';
import { otpEmail } from '../templates/email.ts';
import { hashSecret, randomOtp, randomSalt, randomToken, safeEqualHex, sha256Hex } from '../security/crypto.ts';
import { HttpError, optionalString } from '../security/validate.ts';
import { downloadPayload, publicMetadata, shareStatus } from '../types.ts';

export const accessRouter = Router();

async function loadByAccessToken(token: string) {
  const share = await shareStore.findByAccessHash(sha256Hex(token));
  if (!share) throw new HttpError(404, 'invalid_link', 'This secure link is invalid.');
  return share;
}

function rejectIfBlocked(share: Awaited<ReturnType<typeof loadByAccessToken>>) {
  const status = shareStatus(share);
  if (status === 'revoked') throw new HttpError(410, 'revoked', 'Access to this file has been revoked.');
  if (status === 'expired') throw new HttpError(410, 'expired', 'This secure link has expired.');
  if (status === 'limit') throw new HttpError(409, 'download_limit', 'The download limit for this file has been reached.');
}

function requirePasswordSession(share: Awaited<ReturnType<typeof loadByAccessToken>>) {
  if (!share.password_enabled) return;
  if (!share.password_verified_until || Date.parse(share.password_verified_until) <= Date.now()) {
    throw new HttpError(401, 'password_required', 'Password verification is required first.');
  }
}

accessRouter.get('/:token', async (req, res, next) => {
  try {
    const share = await loadByAccessToken(String(req.params.token));
    await shareStore.update(share.id, { last_accessed_at: new Date().toISOString() });
    const status = shareStatus(share);
    res.json({ status, ...publicMetadata(share) });
  } catch (err) {
    next(err);
  }
});

accessRouter.post('/:token/verify-password', async (req, res, next) => {
  try {
    const share = await loadByAccessToken(String(req.params.token));
    rejectIfBlocked(share);
    if (!share.password_enabled || !share.password_hash || !share.password_salt) {
      throw new HttpError(400, 'password_not_required', 'Password verification is not required.');
    }
    const password = optionalString(req.body?.password);
    if (!password) throw new HttpError(400, 'invalid_password', 'Password is required.');
    const hashed = await hashSecret(password, share.password_salt);
    if (!safeEqualHex(hashed, share.password_hash)) {
      throw new HttpError(401, 'invalid_password', 'That password is incorrect.');
    }

    await shareStore.update(share.id, {
      password_verified_until: new Date(Date.now() + config.otpTtlMs).toISOString(),
    });

    if (share.otp_enabled) {
      return res.json({ ok: true, next: 'otp' });
    }

    const grant = await issueGrant(share.id);
    res.json({ ok: true, next: 'download', grantToken: grant, ...downloadPayload(share) });
  } catch (err) {
    next(err);
  }
});

accessRouter.post('/:token/request-otp', async (req, res, next) => {
  try {
    const share = await loadByAccessToken(String(req.params.token));
    rejectIfBlocked(share);
    requirePasswordSession(share);
    if (!share.otp_enabled) throw new HttpError(400, 'otp_not_required', 'OTP verification is not required.');

    const otp = randomOtp();
    const salt = randomSalt();
    const otpHash = await hashSecret(otp, salt);
    await shareStore.update(share.id, {
      otp_hash: otpHash,
      otp_salt: salt,
      otp_expires_at: new Date(Date.now() + config.otpTtlMs).toISOString(),
      otp_attempts: 0,
    });

    await sendMail({
      to: share.recipient_email,
      ...otpEmail(share.recipient_email, otp, share.original_filename),
    });

    res.json({ ok: true, destination: maskEmail(share.recipient_email) });
  } catch (err) {
    next(err);
  }
});

accessRouter.post('/:token/verify-otp', async (req, res, next) => {
  try {
    const share = await loadByAccessToken(String(req.params.token));
    rejectIfBlocked(share);
    requirePasswordSession(share);
    if (!share.otp_enabled) throw new HttpError(400, 'otp_not_required', 'OTP verification is not required.');
    if (!share.otp_hash || !share.otp_salt || !share.otp_expires_at) {
      throw new HttpError(400, 'otp_not_sent', 'Request a verification code first.');
    }
    if (Date.parse(share.otp_expires_at) <= Date.now()) {
      throw new HttpError(401, 'otp_expired', 'That verification code has expired.');
    }
    if (share.otp_attempts >= 5) {
      throw new HttpError(429, 'otp_locked', 'Too many incorrect codes. Request a new one.');
    }

    const otp = optionalString(req.body?.otp)?.replaceAll(/\s/g, '');
    if (!otp || !/^\d{6}$/.test(otp)) throw new HttpError(400, 'invalid_otp', 'Enter the 6-digit code.');

    const hashed = await hashSecret(otp, share.otp_salt);
    if (!safeEqualHex(hashed, share.otp_hash)) {
      await shareStore.update(share.id, { otp_attempts: share.otp_attempts + 1 });
      throw new HttpError(401, 'invalid_otp', 'That verification code is incorrect.');
    }

    await shareStore.update(share.id, {
      otp_hash: null,
      otp_salt: null,
      otp_expires_at: null,
      otp_attempts: 0,
    });

    const grant = await issueGrant(share.id);
    res.json({ ok: true, next: 'download', grantToken: grant, ...downloadPayload(share) });
  } catch (err) {
    next(err);
  }
});

accessRouter.post('/:token/grant', async (req, res, next) => {
  try {
    const share = await loadByAccessToken(String(req.params.token));
    rejectIfBlocked(share);
    if (share.password_enabled || share.otp_enabled) {
      throw new HttpError(401, 'auth_required', 'Additional verification is required.');
    }
    const grant = await issueGrant(share.id);
    res.json({ ok: true, grantToken: grant, ...downloadPayload(share) });
  } catch (err) {
    next(err);
  }
});

accessRouter.get('/download/:grantToken', async (req, res, next) => {
  try {
    const grantToken = String(req.params.grantToken);
    const share = await shareStore.findByGrantHash(sha256Hex(grantToken));
    if (!share) throw new HttpError(404, 'invalid_grant', 'This download session is invalid.');
    rejectIfBlocked(share);
    if (!share.download_grant_expires_at || Date.parse(share.download_grant_expires_at) <= Date.now()) {
      throw new HttpError(410, 'grant_expired', 'This download session has expired. Verify again.');
    }

    const ciphertext = await getCiphertextBuffer(share.storage_path);
    const digest = createHash('sha256').update(ciphertext).digest('hex');
    if (digest !== share.ciphertext_sha256) {
      throw new HttpError(409, 'integrity_failed', 'File integrity verification failed.');
    }

    const nextCount = share.download_count + 1;
    await shareStore.update(share.id, {
      download_count: nextCount,
      download_grant_hash: null,
      download_grant_expires_at: null,
    });

    if (nextCount >= share.max_downloads) {
      try {
        await deleteCiphertext(share.storage_path);
      } catch {
        // metadata remains so the recipient sees the limit screen
      }
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="securedrop.bin"');
    res.setHeader('X-Content-SHA256', digest);
    res.send(ciphertext);
  } catch (err) {
    next(err);
  }
});

async function issueGrant(shareId: string) {
  const grant = randomToken(32);
  await shareStore.update(shareId, {
    download_grant_hash: sha256Hex(grant),
    download_grant_expires_at: new Date(Date.now() + config.downloadGrantTtlMs).toISOString(),
  });
  return grant;
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return 'the recipient';
  const visible = user.slice(0, 1);
  return `${visible}•••@${domain}`;
}
