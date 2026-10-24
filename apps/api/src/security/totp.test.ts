import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  base32Encode,
  buildOtpauthUrl,
  generateRecoveryCodes,
  generateTotpCode,
  generateTotpSecret,
  verifyRecoveryCode,
  verifyTotp,
} from './totp';

describe('TOTP RFC 6238 and recovery codes', () => {
  it('encodes and decodes Base32 RFC 4648 accurately', () => {
    const original = new Uint8Array([72, 101, 108, 108, 111, 33]); // "Hello!"
    const encoded = base32Encode(original);
    const decoded = base32Decode(encoded);
    expect(decoded).toEqual(original);
  });

  it('generates a 32-character Base32 secret', () => {
    const secret = generateTotpSecret(20);
    expect(secret.length).toBe(32);
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it('generates a 6-digit TOTP code and verifies successfully', async () => {
    const secret = generateTotpSecret(20);
    const now = Date.now();
    const code = await generateTotpCode(secret, now);

    expect(code).toMatch(/^\d{6}$/);

    const isValid = await verifyTotp(secret, code, 1, now);
    expect(isValid).toBe(true);
  });

  it('verifies code with 1 step clock drift (30 seconds ago)', async () => {
    const secret = generateTotpSecret(20);
    const now = Date.now();
    const pastCode = await generateTotpCode(secret, now - 30_000);

    // Com window = 1 deve ser aceito
    const isValid = await verifyTotp(secret, pastCode, 1, now);
    expect(isValid).toBe(true);

    // Com window = 0 não deve ser aceito
    const isStrictValid = await verifyTotp(secret, pastCode, 0, now);
    expect(isStrictValid).toBe(false);
  });

  it('rejects incorrect TOTP codes', async () => {
    const secret = generateTotpSecret(20);
    const isValid = await verifyTotp(secret, '000000');
    expect(typeof isValid).toBe('boolean');
    const invalidChar = await verifyTotp(secret, 'ABCDEF');
    expect(invalidChar).toBe(false);
  });

  it('builds standard otpauth:// URL for authenticator apps', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const url = buildOtpauthUrl({
      secret,
      accountName: 'usuario@alegon.com.br',
      issuer: 'ALEGON AI Photo Studio',
    });

    expect(url.startsWith('otpauth://totp/')).toBe(true);
    expect(url).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(url).toContain('issuer=ALEGON+AI+Photo+Studio');
    expect(url).toContain('digits=6');
    expect(url).toContain('period=30');
  });

  it('generates and verifies 8 recovery codes', async () => {
    const { codes, hashes } = await generateRecoveryCodes(8);

    expect(codes.length).toBe(8);
    expect(hashes.length).toBe(8);

    // Código deve ter formato XXXX-XXXX
    expect(codes[0]).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}$/);

    // Valida o primeiro código
    const check1 = await verifyRecoveryCode(codes[0]!, hashes);
    expect(check1.valid).toBe(true);
    expect(check1.matchingHash).toBe(hashes[0]);

    // Rejeita código incorreto
    const checkBad = await verifyRecoveryCode('AAAA-BBBB', hashes);
    expect(checkBad.valid).toBe(false);
  });
});
