import type { AccessMetadata, CreateShareResult, DownloadSecrets, ManagedShare } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function parseError(response: Response): Promise<never> {
  let code = 'request_failed';
  let message = 'Request failed. Please try again.';
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    code = body.error ?? code;
    message = body.message ?? message;
  } catch {
    // ignore invalid JSON
  }
  throw new ApiError(response.status, code, message);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  });
  if (!response.ok) await parseError(response);
  return response.json() as Promise<T>;
}

export function createShare(form: FormData, onUploadProgress?: (percent: number) => void): Promise<CreateShareResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/shares`);
    xhr.responseType = 'json';
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onUploadProgress) return;
      onUploadProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as CreateShareResult);
        return;
      }
      const body = xhr.response as { error?: string; message?: string } | null;
      reject(new ApiError(xhr.status, body?.error ?? 'request_failed', body?.message ?? 'Upload failed.'));
    };
    xhr.onerror = () => reject(new ApiError(0, 'network', 'Network error while uploading the encrypted file.'));
    xhr.send(form);
  });
}

export const api = {
  health: () => request<{ ok: boolean; storage: string; email: string }>('/api/health'),
  access: (token: string) => request<AccessMetadata>(`/api/access/${token}`),
  verifyPassword: (token: string, password: string) =>
    request<{ ok: true; next: 'otp' | 'download' } & Partial<DownloadSecrets>>(`/api/access/${token}/verify-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  requestOtp: (token: string) =>
    request<{ ok: true; destination: string }>(`/api/access/${token}/request-otp`, { method: 'POST' }),
  verifyOtp: (token: string, otp: string) =>
    request<{ ok: true; next: 'download' } & DownloadSecrets>(`/api/access/${token}/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    }),
  grant: (token: string) =>
    request<{ ok: true; grantToken: string } & DownloadSecrets>(`/api/access/${token}/grant`, { method: 'POST' }),
  download: async (grantToken: string) => {
    const response = await fetch(`${API_BASE}/api/access/download/${grantToken}`);
    if (!response.ok) await parseError(response);
    return response.arrayBuffer();
  },
  manage: (token: string) => request<ManagedShare>(`/api/manage/${token}`),
  revoke: (token: string) =>
    request<{ ok: true; status: string; revokedAt?: string }>(`/api/manage/${token}/revoke`, { method: 'POST' }),
  resendEmail: (manageToken: string, accessToken: string) =>
    request<{ ok: true; emailDelivered: boolean }>(`/api/manage/${manageToken}/resend-email`, {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    }),
};
