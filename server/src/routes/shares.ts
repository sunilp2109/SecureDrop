import { Router } from 'express';
import multer from 'multer';
import os from 'node:os';
import path from 'node:path';
import { config } from '../config.ts';
import { shareStore } from '../db/index.ts';
import { putCiphertext, removeTemp } from '../services/blobStore.ts';
import { sendMail } from '../services/email.ts';
import { formatBytes, formatExpiry } from '../services/format.ts';
import { accessEmail } from '../templates/email.ts';
import { hashSecret, newId, randomSalt, randomToken, sha256Hex } from '../security/crypto.ts';
import {
  assertBase64Url,
  assertEmail,
  assertInt,
  assertSha256,
  HttpError,
  optionalString,
  parseBoolean,
  sanitizeFilename,
} from '../security/validate.ts';
import type { ShareRecord } from '../types.ts';

const upload = multer({
  dest: path.join(os.tmpdir(), 'securedrop'),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
});

export const sharesRouter = Router();

sharesRouter.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, 'missing_file', 'Encrypted file is required.');
    if (req.file.size < 16) throw new HttpError(400, 'invalid_file', 'Encrypted file is too small.');
    if (req.file.size > config.maxUploadBytes) {
      throw new HttpError(413, 'file_too_large', 'Encrypted file exceeds the upload limit.');
    }

    const recipientEmail = assertEmail(req.body.recipientEmail);
    const originalFilename = sanitizeFilename(req.body.originalFilename);
    const sha256 = assertSha256(req.body.sha256);
    const iv = assertBase64Url(req.body.iv, 'Initialization vector', 12, 64);
    const passwordEnabled = parseBoolean(req.body.passwordEnabled);
    const otpEnabled = parseBoolean(req.body.otpEnabled);
    const maxDownloads = assertInt(Number(req.body.maxDownloads), 'Download limit', 1, 20);
    const expiresInHours = assertInt(Number(req.body.expiresInHours), 'Expiration', 1, 168);
    const mimeType = optionalString(req.body.mimeType)?.slice(0, 120) ?? 'application/octet-stream';

    let wrappedDek: string | null = null;
    let kdfSalt: string | null = null;
    let kdfIterations: number | null = null;
    let passwordSalt: string | null = null;
    let passwordHash: string | null = null;

    if (passwordEnabled) {
      const password = optionalString(req.body.password);
      if (!password || password.length < 8 || password.length > 128) {
        throw new HttpError(400, 'invalid_password', 'Password must be between 8 and 128 characters.');
      }
      wrappedDek = assertBase64Url(req.body.wrappedDek, 'Wrapped key', 32, 4096);
      kdfSalt = assertBase64Url(req.body.kdfSalt, 'KDF salt', 8, 128);
      kdfIterations = assertInt(Number(req.body.kdfIterations ?? config.pbkdf2Iterations), 'KDF iterations', 100000, 1_000_000);
      passwordSalt = randomSalt();
      passwordHash = await hashSecret(password, passwordSalt);
    }

    const accessToken = randomToken(32);
    const manageToken = randomToken(32);
    const id = newId();
    const storagePath = `${id}.bin`;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

    await putCiphertext(storagePath, req.file.path);
    await removeTemp(req.file.path);

    const record: ShareRecord = {
      id,
      access_token_hash: sha256Hex(accessToken),
      manage_token_hash: sha256Hex(manageToken),
      recipient_email: recipientEmail,
      original_filename: originalFilename,
      mime_type: mimeType,
      size_bytes: req.file.size,
      storage_path: storagePath,
      ciphertext_sha256: sha256,
      iv,
      wrapped_dek: wrappedDek,
      kdf_salt: kdfSalt,
      kdf_iterations: kdfIterations,
      password_enabled: passwordEnabled,
      password_salt: passwordSalt,
      password_hash: passwordHash,
      otp_enabled: otpEnabled,
      otp_hash: null,
      otp_salt: null,
      otp_expires_at: null,
      otp_attempts: 0,
      max_downloads: maxDownloads,
      download_count: 0,
      expires_at: expiresAt,
      revoked_at: null,
      download_grant_hash: null,
      download_grant_expires_at: null,
      password_verified_until: null,
      created_at: new Date().toISOString(),
      last_accessed_at: null,
    };

    await shareStore.create(record);

    const accessUrl = `${config.appUrl}/access/${accessToken}`;
    const mail = accessEmail({
      recipientEmail,
      fileName: originalFilename,
      fileSizeLabel: formatBytes(req.file.size),
      expiresAtLabel: formatExpiry(expiresAt),
      maxDownloads,
      passwordEnabled,
      otpEnabled,
      accessUrl,
    });

    let emailDelivered = false;
    try {
      const result = await sendMail({ to: recipientEmail, ...mail });
      emailDelivered = result.delivered;
    } catch {
      emailDelivered = false;
    }

    res.status(201).json({
      id,
      accessToken,
      manageToken,
      accessUrl,
      expiresAt,
      emailDelivered,
      passwordEnabled,
      otpEnabled,
    });
  } catch (err) {
    await removeTemp(req.file?.path);
    next(err);
  }
});
