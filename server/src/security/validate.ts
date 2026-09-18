const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const HEX64_RE = /^[a-f0-9]{64}$/;
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function assertEmail(value: unknown): string {
  if (typeof value !== 'string') throw new HttpError(400, 'invalid_email', 'Recipient email is required.');
  const email = value.trim().toLowerCase();
  if (email.length < 5 || email.length > 254 || !EMAIL_RE.test(email)) {
    throw new HttpError(400, 'invalid_email', 'Enter a valid recipient email address.');
  }
  return email;
}

export function sanitizeFilename(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'invalid_filename', 'Original file name is required.');
  }
  const base = value.replace(/[\u0000-\u001f<>:"/\\|?*]/g, '_').replace(/^-+/, '').trim();
  const name = base.slice(0, 180) || 'encrypted-file';
  return name;
}

export function assertSha256(value: unknown): string {
  if (typeof value !== 'string' || !HEX64_RE.test(value.toLowerCase())) {
    throw new HttpError(400, 'invalid_hash', 'A valid SHA-256 checksum is required.');
  }
  return value.toLowerCase();
}

export function assertBase64Url(value: unknown, field: string, min = 8, max = 4096): string {
  if (typeof value !== 'string' || value.length < min || value.length > max || !BASE64URL_RE.test(value)) {
    throw new HttpError(400, 'invalid_field', `${field} is invalid.`);
  }
  return value;
}

export function assertInt(value: unknown, field: string, min: number, max: number): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, 'invalid_field', `${field} is invalid.`);
  }
  return n;
}

export function parseBoolean(value: unknown): boolean {
  if (value === true || value === 'true' || value === '1' || value === 1) return true;
  if (value === false || value === 'false' || value === '0' || value === 0 || value == null) return false;
  throw new HttpError(400, 'invalid_field', 'Boolean field is invalid.');
}

export function optionalString(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string') throw new HttpError(400, 'invalid_field', 'Invalid string field.');
  return value;
}
