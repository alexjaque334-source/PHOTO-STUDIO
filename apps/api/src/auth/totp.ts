/**
 * Gerador e validador TOTP RFC 6238 via WebCrypto nativo.
 * Dono: Backend Engineer
 */
import { sha256Hex } from './crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(bytes: Uint8Array): string {
  let result = '';
  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < bytes.length; i++) {
    buffer = (buffer << 8) | bytes[i]!;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      result += BASE32_ALPHABET[(buffer >> bitsLeft) & 31];
    }
  }

  if (bitsLeft > 0) {
    result += BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 31];
  }

  return result;
}

export function base32Decode(str: string): Uint8Array {
  const cleaned = str.toUpperCase().replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned[i]!);
    if (val === -1) continue;
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push((buffer >> bitsLeft) & 255);
    }
  }

  return new Uint8Array(bytes);
}

export function generateTotpSecret(bytesCount: number = 20): string {
  const bytes = crypto.getRandomValues(new Uint8Array(bytesCount));
  return base32Encode(bytes);
}

export function buildOtpauthUrl(label: string, issuer: string, secretBase32: string): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedLabel = encodeURIComponent(label);
  return `otpauth://totp/${encodedIssuer}:${encodedLabel}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

async function hmacSha1(keyBytes: Uint8Array, messageBytes: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, messageBytes);
  return new Uint8Array(signature);
}

export async function generateTotpCode(secretBase32: string, timeStep: number): Promise<string> {
  const keyBytes = base32Decode(secretBase32);
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  // Big-endian 64-bit int
  view.setUint32(0, Math.floor(timeStep / 0x100000000));
  view.setUint32(4, timeStep & 0xffffffff);

  const hash = await hmacSha1(keyBytes, new Uint8Array(counterBuffer));
  const offset = hash[hash.length - 1]! & 0x0f;

  const binary =
    ((hash[offset]! & 0x7f) << 24) |
    ((hash[offset + 1]! & 0xff) << 16) |
    ((hash[offset + 2]! & 0xff) << 8) |
    (hash[offset + 3]! & 0xff);

  const otp = binary % 1_000_000;
  return otp.toString().padStart(6, '0');
}

/**
 * Validação de TOTP com tolerância de janela (window = 1 significa ±30s).
 */
export async function verifyTotp(
  secretBase32: string,
  token: string,
  windowSteps: number = 1,
): Promise<boolean> {
  const trimmed = token.trim();
  if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
    return false;
  }

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  for (let step = -windowSteps; step <= windowSteps; step++) {
    const candidate = await generateTotpCode(secretBase32, currentStep + step);
    if (candidate === trimmed) {
      return true;
    }
  }

  return false;
}

/**
 * Gera códigos de recuperação de uso único (ex: 8 códigos de 10 caracteres hex)
 * e retorna seus valores em texto claro e seus hashes SHA-256 para persistência.
 */
export async function generateRecoveryCodes(count: number = 8): Promise<{
  codes: string[];
  hashes: string[];
}> {
  const codes: string[] = [];
  const hashes: string[] = [];

  for (let i = 0; i < count; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    const code = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    const formatted = `${code.slice(0, 5)}-${code.slice(5, 10)}`;
    codes.push(formatted);
    hashes.push(await sha256Hex(formatted));
  }

  return { codes, hashes };
}
