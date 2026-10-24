import { describe, expect, it } from 'vitest';
import {
  decrypt,
  encrypt,
  fromBase64,
  fromHex,
  hashIp,
  hmacSha256,
  randomToken,
  sha256Hex,
  timingSafeEqual,
  toBase64Url,
  toHex,
} from './crypto';

describe('crypto utils', () => {
  const TEST_KEY_B64 = 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI='; // 32 bytes em base64

  it('calculates deterministic sha256Hex', async () => {
    const hash = await sha256Hex('alegon-photo-studio');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    const hashAgain = await sha256Hex('alegon-photo-studio');
    expect(hash).toBe(hashAgain);
  });

  it('calculates hmacSha256 properly', async () => {
    const sig = await hmacSha256('secret-key', 'data-payload');
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it('performs timingSafeEqual comparison', () => {
    expect(timingSafeEqual('token123', 'token123')).toBe(true);
    expect(timingSafeEqual('token123', 'token124')).toBe(false);
    expect(timingSafeEqual('short', 'longer-string')).toBe(false);
  });

  it('generates random url-safe tokens', () => {
    const token1 = randomToken(32);
    const token2 = randomToken(32);
    expect(token1).not.toBe(token2);
    expect(token1).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('hashes IP addresses with salt for LGPD compliance', async () => {
    const hash1 = await hashIp('192.168.1.100', 'salt-secret');
    const hash2 = await hashIp('192.168.1.100', 'salt-secret');
    const hash3 = await hashIp('10.0.0.1', 'salt-secret');

    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it('encrypts and decrypts with AES-256-GCM', async () => {
    const env = { DATA_ENCRYPTION_KEY: TEST_KEY_B64 };
    const originalText = 'SegredoConfidencialDoUsuario123!';

    const ciphertext = await encrypt(env, originalText);
    expect(ciphertext.startsWith('v1.')).toBe(true);
    expect(ciphertext).not.toContain(originalText);

    const decrypted = await decrypt(env, ciphertext);
    expect(decrypted).toBe(originalText);
  });

  it('fails decryption on tampered ciphertext', async () => {
    const env = { DATA_ENCRYPTION_KEY: TEST_KEY_B64 };
    const ciphertext = await encrypt(env, 'dados-autenticados');
    const parts = ciphertext.split('.');
    // Modifica o último caractere do payload
    const tampered = `${parts[0]}.${parts[1]}.${parts[2]!.slice(0, -1)}A`;

    await expect(decrypt(env, tampered)).rejects.toThrow();
  });

  it('converts hex and base64 accurately', () => {
    const bytes = new Uint8Array([1, 2, 3, 254, 255]);
    const hex = toHex(bytes);
    expect(hex).toBe('010203feff');
    expect(fromHex(hex)).toEqual(bytes);

    const b64 = toBase64Url(bytes);
    expect(fromBase64(b64)).toEqual(bytes);
  });
});
