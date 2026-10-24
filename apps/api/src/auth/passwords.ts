/**
 * Validação de senhas e proteção contra senhas fracas / comuns.
 * Dono: Backend Engineer
 */
import { DomainError } from '../contracts';

// Conjunto das senhas fracas e triviais mais comuns (> 10 caracteres e variantes frequentes)
const COMMON_PASSWORDS = new Set([
  '1234567890',
  '12345678901',
  '123456789012',
  'password123',
  'password1234',
  'password12345',
  'password2024',
  'password2025',
  'password2026',
  'qwertyuiop',
  'qwertyuiop1',
  'asdfghjkl123',
  'admin123456',
  'administrator',
  'changeme123',
  'iloveyou123',
  'letmein1234',
  'welcome1234',
  'sunshine123',
  'master12345',
  'princess123',
  'football123',
  'monkey12345',
  'shadow12345',
  'dragon12345',
  'alegon12345',
  'alegon2026',
  'studio12345',
  'photo123456',
]);

export function validatePasswordStrength(password: string): void {
  if (typeof password !== 'string') {
    throw new DomainError('PASSWORD_INVALID', 'Senha deve ser uma cadeia de caracteres.', 422);
  }

  if (password.length < 10) {
    throw new DomainError(
      'PASSWORD_TOO_SHORT',
      'A senha deve ter no mínimo 10 caracteres.',
      422,
    );
  }

  if (password.length > 128) {
    throw new DomainError(
      'PASSWORD_TOO_LONG',
      'A senha não pode exceder 128 caracteres.',
      422,
    );
  }

  const normalized = password.toLowerCase().trim();
  if (COMMON_PASSWORDS.has(normalized)) {
    throw new DomainError(
      'PASSWORD_TOO_COMMON',
      'Esta senha é muito comum e insegura. Escolha uma senha mais forte.',
      422,
    );
  }

  // Verifica se a senha não é só repetição de um único caractere
  if (/^(.)\1+$/.test(password)) {
    throw new DomainError(
      'PASSWORD_TOO_SIMPLE',
      'A senha não pode ser composta pelo mesmo caractere repetido.',
      422,
    );
  }
}
