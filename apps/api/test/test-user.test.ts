import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/auth/crypto';

describe('Aprovação da Conta de Usuário de Teste (exemplo25@gmail.com)', () => {
  it('deve validar que a senha Loko1998*** corresponde ao hash oficial PBKDF2', async () => {
    const storedHash = 'pbkdf2-sha256$100000$OlV+j05cKXADF95k493buA==$Dhza//SOeV2ftL1ROxGaXfzgjWD4UFIe4TZHC6czcKE=';
    const isMatch = await verifyPassword('Loko1998***', storedHash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword('SenhaErrada123', storedHash);
    expect(isWrongMatch).toBe(false);
  });

  it('deve gerar novos hashes válidos para Loko1998***', async () => {
    const freshHash = await hashPassword('Loko1998***');
    expect(freshHash).toMatch(/^pbkdf2-sha256\$100000\$/);
    expect(await verifyPassword('Loko1998***', freshHash)).toBe(true);
  });
});
