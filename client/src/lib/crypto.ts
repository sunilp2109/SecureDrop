const encoder = new TextEncoder();
export const PBKDF2_ITERATIONS = 210_000;

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(data: BufferSource): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hash));
}

async function deriveKek(password: string, saltB64: string, iterations: number) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: base64UrlToBytes(saltB64) as BufferSource, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export type EncryptResult = {
  ciphertext: Blob;
  iv: string;
  sha256: string;
  wrappedDek?: string;
  kdfSalt?: string;
  kdfIterations?: number;
  dekFragment?: string;
};

export async function encryptFile(
  file: File,
  password: string | null,
  onProgress?: (percent: number, label: string) => void,
): Promise<EncryptResult> {
  onProgress?.(10, 'Reading file in the browser');
  const plaintext = await file.arrayBuffer();

  onProgress?.(22, 'Generating AES-256-GCM key');
  const dek = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  onProgress?.(48, 'Encrypting file locally');
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dek, plaintext);

  onProgress?.(68, 'Computing SHA-256 integrity hash');
  const sha256 = await sha256Hex(ciphertext);
  const rawDek = new Uint8Array(await crypto.subtle.exportKey('raw', dek));

  const result: EncryptResult = {
    ciphertext: new Blob([ciphertext], { type: 'application/octet-stream' }),
    iv: bytesToBase64Url(iv),
    sha256,
  };

  if (password) {
    onProgress?.(78, 'Wrapping key with password');
    const kdfSalt = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
    const kek = await deriveKek(password, kdfSalt, PBKDF2_ITERATIONS);
    const wrapIv = crypto.getRandomValues(new Uint8Array(12));
    const wrapped = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: wrapIv }, kek, rawDek));
    const packed = new Uint8Array(wrapIv.length + wrapped.length);
    packed.set(wrapIv);
    packed.set(wrapped, wrapIv.length);
    result.wrappedDek = bytesToBase64Url(packed);
    result.kdfSalt = kdfSalt;
    result.kdfIterations = PBKDF2_ITERATIONS;
  } else {
    result.dekFragment = bytesToBase64Url(rawDek);
  }

  rawDek.fill(0);
  onProgress?.(84, 'Preparing encrypted upload');
  return result;
}

export async function decryptFile(input: {
  ciphertext: ArrayBuffer;
  iv: string;
  sha256: string;
  password?: string;
  wrappedDek?: string | null;
  kdfSalt?: string | null;
  kdfIterations?: number | null;
  dekFragment?: string | null;
}): Promise<Blob> {
  const actual = await sha256Hex(input.ciphertext);
  if (actual !== input.sha256) {
    throw new Error('integrity');
  }

  let rawDek: Uint8Array;
  if (input.password && input.wrappedDek && input.kdfSalt && input.kdfIterations) {
    const kek = await deriveKek(input.password, input.kdfSalt, input.kdfIterations);
    const packed = base64UrlToBytes(input.wrappedDek);
    const wrapIv = packed.slice(0, 12);
    const wrapped = packed.slice(12);
    rawDek = new Uint8Array(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv: wrapIv as BufferSource }, kek, wrapped as BufferSource),
    );
  } else if (input.dekFragment) {
    rawDek = base64UrlToBytes(input.dekFragment);
  } else {
    throw new Error('missing_key');
  }

  const dek = await crypto.subtle.importKey('raw', rawDek as BufferSource, { name: 'AES-GCM' }, false, ['decrypt']);
  rawDek.fill(0);
  const iv = base64UrlToBytes(input.iv);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, dek, input.ciphertext);
  return new Blob([plain]);
}

export function readKeyFromHash(): string | null {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  return params.get('k');
}
