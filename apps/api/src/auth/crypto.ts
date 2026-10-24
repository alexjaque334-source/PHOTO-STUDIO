/**
 * Utilitários criptográficos WebCrypto para Autenticação.
 * Dono: Backend Engineer
 */

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

/**
 * Hash de senha com PBKDF2-SHA256 (100.000 iterações, salt 16 bytes).
 * Formato gerado: pbkdf2-sha256$100000$<saltB64>$<hashB64>
 */
export async function hashPassword(password: string): Promise<string> {
  const iterations = 100_000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    256,
  );

  const saltB64 = uint8ArrayToBase64(salt);
  const hashB64 = uint8ArrayToBase64(new Uint8Array(derivedBits));

  return `pbkdf2-sha256$${iterations}$${saltB64}$${hashB64}`;
}

/**
 * Verificação de senha em tempo constante contra o hash armazenado.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') {
    return false;
  }

  const iterations = parseInt(parts[1]!, 10);
  const saltB64 = parts[2]!;
  const expectedHashB64 = parts[3]!;

  if (isNaN(iterations) || iterations < 1000) {
    return false;
  }

  const salt = base64ToUint8Array(saltB64);
  const expectedHash = base64ToUint8Array(expectedHashB64);

  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    256,
  );

  const actualHash = new Uint8Array(derivedBits);
  return constantTimeCompare(actualHash, expectedHash);
}

/**
 * SHA-256 em formato hexadecimal.
 */
export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return bufferToHex(hash);
}

/**
 * Token aleatório criptográfico (32 bytes por padrão em hex).
 */
export function randomToken(bytesCount: number = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(bytesCount));
  return bufferToHex(bytes);
}

/**
 * HMAC-SHA256 gerando assinatura hexadecimal.
 */
export async function hmacSha256(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return bufferToHex(sig);
}

/**
 * Criptografia simétrica AES-GCM (para segredos MFA no banco).
 */
export async function encryptAesGcm(keyBase64: string, plaintext: string): Promise<string> {
  const rawKey = base64ToUint8Array(keyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoded,
  );

  const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextBuffer), iv.length);
  return uint8ArrayToBase64(combined);
}

/**
 * Descriptografia simétrica AES-GCM.
 */
export async function decryptAesGcm(keyBase64: string, encryptedBase64: string): Promise<string> {
  const rawKey = base64ToUint8Array(keyBase64);
  const combined = base64ToUint8Array(encryptedBase64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}
