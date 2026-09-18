export type ShareStatus = 'ok' | 'expired' | 'revoked' | 'limit';

export type AccessMetadata = {
  status: ShareStatus;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  passwordEnabled: boolean;
  otpEnabled: boolean;
  expiresAt: string;
  maxDownloads: number;
  downloadCount: number;
  createdAt: string;
};

export type DownloadSecrets = {
  grantToken: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  sha256: string;
  iv: string;
  wrappedDek: string | null;
  kdfSalt: string | null;
  kdfIterations: number | null;
  passwordEnabled: boolean;
};

export type CreateShareResult = {
  id: string;
  accessToken: string;
  manageToken: string;
  accessUrl: string;
  expiresAt: string;
  emailDelivered: boolean;
  passwordEnabled: boolean;
  otpEnabled: boolean;
};

export type SavedDrop = {
  id: string;
  manageToken: string;
  accessToken: string;
  accessUrl: string;
  fileName: string;
  recipientEmail: string;
  createdAt: string;
  expiresAt: string;
  emailDelivered: boolean;
  passwordEnabled: boolean;
  otpEnabled: boolean;
  maxDownloads: number;
  dekFragment?: string;
};

export type ManagedShare = {
  id: string;
  status: ShareStatus;
  recipientEmail: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  passwordEnabled: boolean;
  otpEnabled: boolean;
  expiresAt: string;
  maxDownloads: number;
  downloadCount: number;
  createdAt: string;
  sha256: string;
  revokedAt: string | null;
};
