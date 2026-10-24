/**
 * Implementação de autenticação em duas etapas (TOTP) RFC 6238 e códigos de recuperação.
 * Dono: Subagente 6 (Segurança e LGPD).
 *
 * Especificações:
 * - RFC 6238 (TOTP) e RFC 4226 (HOTP)
 * - Algoritmo: HMAC-SHA-1
 * - Período: 30 segundos
 * - Dígitos: 6
 * - Codificação: Base32 (RFC 4648)
 * - Códigos de recuperação com hashes SHA-256
 */
import { sha256Hex, timingSafeEqual } from './crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Codifica buffer em string Base32 RFC 4648 sem padding.
 */
export function base32Encode(buffer: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]!;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodifica string Base32 RFC 4648 para Uint8Array.
 */
export function base32Decode(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]!;
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) {
      throw new Error(`Caractere Base32 inválido: ${char}`);
    }

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Gera segredo criptográfico aleatório para TOTP (160 bits / 20 bytes recomendados pela RFC 4226).
 */
export function generateTotpSecret(byteLength: number = 20): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return base32Encode(randomBytes);
}

/**
 * Gera código numérico TOTP de 6 dígitos para determinado contador temporal.
 */
export async function generateTotpCode(
  secretBase32: string,
  timestampMs: number = Date.now(),
  stepSeconds: number = 30,
): Promise<string> {
  const secretBytes = base32Decode(secretBase32);
  const timeStep = Math.floor(timestampMs / 1000 / stepSeconds);

  // Buffer de 8 bytes big-endian para o contador
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(timeStep), false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );

  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, buffer));

  // Dynamic Truncation (RFC 4226 §5.4)
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  const otp = (code % 1_000_000).toString().padStart(6, '0');
  return otp;
}

/**
 * Valida um código TOTP de 6 dígitos com tolerância de drift temporal (+/- window passos).
 */
export async function verifyTotp(
  secretBase32: string,
  code: string,
  windowSteps: number = 1,
  timestampMs: number = Date.now(),
): Promise<boolean> {
  const sanitized = (code || '').trim().replace(/\s/g, '');
  if (!/^\d{6}$/.test(sanitized)) {
    return false;
  }

  const stepSeconds = 30;
  const currentStep = Math.floor(timestampMs / 1000 / stepSeconds);

  for (let i = -windowSteps; i <= windowSteps; i++) {
    const stepTime = (currentStep + i) * stepSeconds * 1000;
    const generated = await generateTotpCode(secretBase32, stepTime, stepSeconds);
    if (timingSafeEqual(sanitized, generated)) {
      return true;
    }
  }

  return false;
}

/**
 * Constrói URL otpauth:// para exibição em QR Code de aplicativos autenticadores
 * (Google Authenticator, Microsoft Authenticator, 1Password, Bitwarden, etc.).
 */
export function buildOtpauthUrl(params: {
  secret: string;
  accountName: string;
  issuer?: string;
}): string {
  const issuer = params.issuer || 'ALEGON Photo Studio';
  const account = params.accountName.trim();
  const label = `${issuer}:${account}`;

  const query = new URLSearchParams({
    secret: params.secret.replace(/[\s-]/g, '').toUpperCase(),
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });

  return `otpauth://totp/${encodeURIComponent(label)}?${query.toString()}`;
}

// Caracteres legíveis sem ambiguidade (removidos 0, O, 1, I, L)
const RECOVERY_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Gera conjunto de códigos de recuperação de backup descartáveis formatados como XXXX-XXXX.
 */
export async function generateRecoveryCodes(
  count: number = 8,
): Promise<{ codes: string[]; hashes: string[] }> {
  const codes: string[] = [];
  const hashes: string[] = [];

  for (let c = 0; c < count; c++) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    let codeStr = '';
    for (let i = 0; i < 8; i++) {
      codeStr += RECOVERY_CHARSET[bytes[i]! % RECOVERY_CHARSET.length];
      if (i === 3) codeStr += '-';
    }
    codes.push(codeStr);
    const hash = await sha256Hex(codeStr.replace('-', '').toUpperCase());
    hashes.push(hash);
  }

  return { codes, hashes };
}

/**
 * Verifica se um código de recuperação fornecido coincide com algum dos hashes armazenados.
 */
export async function verifyRecoveryCode(
  inputCode: string,
  storedHashes: string[],
): Promise<{ valid: boolean; matchingHash?: string }> {
  const normalized = (inputCode || '').replace(/[\s-]/g, '').toUpperCase();
  if (normalized.length !== 8) {
    return { valid: false };
  }

  const inputHash = await sha256Hex(normalized);

  for (const stored of storedHashes) {
    if (timingSafeEqual(inputHash, stored)) {
      return { valid: true, matchingHash: stored };
    }
  }

  return { valid: false };
}
