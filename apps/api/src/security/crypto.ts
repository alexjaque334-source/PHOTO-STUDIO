/**
/**
 * Utilitários criptográficos WebCrypto para o ALEGON AI Photo Studio.
 * Dono: Subagente 6 (Segurança e LGPD).
 *
 * Suporta execução nativa em Cloudflare Workers e Node.js (vitest) via Web Crypto API global.
 */

/** Converte Uint8Array para string hex. */
export function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, '0');
  }
  return hex;
}

/** Converte string hex para Uint8Array. */
export function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Converte Uint8Array para base64url sem padding. */
export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Converte base64 ou base64url para Uint8Array. */
export function fromBase64(b64: string): Uint8Array {
  let standard = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (standard.length % 4 !== 0) {
    standard += '=';
  }
  const binary = atob(standard);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Gera um token aleatório seguro codificado em base64url.
 */
export function randomToken(bytesLength: number = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(bytesLength));
  return toBase64Url(bytes);
}

/**
 * Calcula o hash SHA-256 e retorna em formato hexadecimal.
 */
export async function sha256Hex(data: string | Uint8Array | ArrayBuffer): Promise<string> {
  const bytes =
    typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
        ? data
        : new Uint8Array(data);

  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return toHex(digest);
}

/**
 * Calcula HMAC-SHA-256 e retorna em formato hexadecimal.
 */
export async function hmacSha256(
  secret: string | Uint8Array,
  data: string | Uint8Array,
): Promise<string> {
  const keyBytes = typeof secret === 'string' ? new TextEncoder().encode(secret) : secret;
  const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);
  return toHex(signature);
}

/**
 * Comparação em tempo constante para mitigar timing attacks.
 */
export function timingSafeEqual(
  a: string | Uint8Array,
  b: string | Uint8Array,
): boolean {
  const aBytes = typeof a === 'string' ? new TextEncoder().encode(a) : a;
  const bBytes = typeof b === 'string' ? new TextEncoder().encode(b) : b;

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < aBytes.length; i++) {
    mismatch |= aBytes[i]! ^ bBytes[i]!;
  }
  return mismatch === 0;
}

/**
 * Gera hash de endereço IP combinado com segredo da aplicação.
 * Protege a privacidade de titulares em conformidade com a LGPD.
 */
export async function hashIp(ip: string, secret: string): Promise<string> {
  const normalized = (ip || '').trim().toLowerCase();
  return sha256Hex(`${normalized}:${secret}`);
}

/**
 * Resolve a chave de criptografia de dados (AES-256-GCM) a partir da variável de ambiente.
 * Aceita base64 (32 bytes), hex (64 chars) ou raw utf-8 (32 bytes).
 */
function parseEncryptionKey(rawKey: string): Uint8Array {
  if (!rawKey) {
    throw new Error('DATA_ENCRYPTION_KEY não configurada no ambiente.');
  }

  const trimmed = rawKey.trim();

  // 1. Tenta decodificar como Base64 / Base64URL
  try {
    const bytes = fromBase64(trimmed);
    if (bytes.length === 32) return bytes;
  } catch {
    // continua
  }

  // 2. Se tem 64 caracteres hexadecimais -> 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    const bytes = fromHex(trimmed);
    if (bytes.length === 32) return bytes;
  }

  // 3. Se string raw UTF-8 de 32 bytes
  const utf8Bytes = new TextEncoder().encode(trimmed);
  if (utf8Bytes.length === 32) {
    return utf8Bytes;
  }

  throw new Error('DATA_ENCRYPTION_KEY inválida. Deve conter exatamente 32 bytes (base64 de 32 bytes ou hex de 64 caracteres).');
}

/**
 * Criptografa texto simples com AES-256-GCM.
 * Retorna string no formato: v1.<iv_base64url>.<ciphertext_and_tag_base64url>
 */
export async function encrypt(
  env: { DATA_ENCRYPTION_KEY: string },
  plaintext: string,
): Promise<string> {
  const keyBytes = parseEncryptionKey(env.DATA_ENCRYPTION_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits recomendado para GCM
  const plaintextBytes = new TextEncoder().encode(plaintext);

  const ciphertextWithTag = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintextBytes,
  );

  const ivB64 = toBase64Url(iv);
  const dataB64 = toBase64Url(new Uint8Array(ciphertextWithTag));

  return `v1.${ivB64}.${dataB64}`;
}

/**
 * Descriptografa texto cifrado pelo método encrypt().
 */
export async function decrypt(
  env: { DATA_ENCRYPTION_KEY: string },
  ciphertextPayload: string,
): Promise<string> {
  const parts = ciphertextPayload.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') {
    throw new Error('Formato de carga criptografada inválido.');
  }

  const iv = fromBase64(parts[1]!);
  const data = fromBase64(parts[2]!);

  const keyBytes = parseEncryptionKey(env.DATA_ENCRYPTION_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );

  const decryptedBytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data,
  );

  return new TextDecoder().decode(decryptedBytes);
}
