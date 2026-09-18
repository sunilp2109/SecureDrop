export type ShareRecord = {
  id: string;
  access_token_hash: string;
  manage_token_hash: string;
  recipient_email: string;
  original_filename: string;
  mime_type: string | null;
  size_bytes: number;
  storage_path: string;
  ciphertext_sha256: string;
  iv: string;
  wrapped_dek: string | null;
  kdf_salt: string | null;
  kdf_iterations: number | null;
  password_enabled: boolean;
  password_salt: string | null;
  password_hash: string | null;
  otp_enabled: boolean;
  otp_hash: string | null;
  otp_salt: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
  max_downloads: number;
  download_count: number;
  expires_at: string;
  revoked_at: string | null;
  download_grant_hash: string | null;
  download_grant_expires_at: string | null;
  password_verified_until: string | null;
  created_at: string;
  last_accessed_at: string | null;
};

export type ShareStatus = 'ok' | 'expired' | 'revoked' | 'limit';

export function shareStatus(share: ShareRecord): ShareStatus {
  if (share.revoked_at) return 'revoked';
  if (Date.parse(share.expires_at) <= Date.now()) return 'expired';
  if (share.download_count >= share.max_downloads) return 'limit';
  return 'ok';
}

export function publicMetadata(share: ShareRecord) {
  return {
    fileName: share.original_filename,
    mimeType: share.mime_type,
    sizeBytes: share.size_bytes,
    passwordEnabled: share.password_enabled,
    otpEnabled: share.otp_enabled,
    expiresAt: share.expires_at,
    maxDownloads: share.max_downloads,
    downloadCount: share.download_count,
    createdAt: share.created_at,
  };
}

export function downloadPayload(share: ShareRecord) {
  return {
    fileName: share.original_filename,
    mimeType: share.mime_type,
    sizeBytes: share.size_bytes,
    sha256: share.ciphertext_sha256,
    iv: share.iv,
    wrappedDek: share.wrapped_dek,
    kdfSalt: share.kdf_salt,
    kdfIterations: share.kdf_iterations,
    passwordEnabled: share.password_enabled,
  };
}
