/**
 * ALEGON AI Photo Studio — Gerenciador de Clientes Asaas
 * Dono: Subagente 5 (Asaas e Billing)
 *
 * Garante a criação idempotente e vinculação do usuário ao Asaas respeitando a LGPD:
 * - Coleta de CPF/CNPJ estritamente no checkout
 * - Persistência em asaas_customers e profiles
 */
import type { Env } from '../env';
import { AsaasClient, type AsaasCustomer } from './asaas-client';
import { nowIso } from '../lib/http';
import { DomainError } from '../contracts';

export async function getOrCreateAsaasCustomer(
  env: Env,
  client: AsaasClient,
  userId: string,
  input: {
    cpfCnpj?: string;
    name?: string;
    phone?: string;
  },
): Promise<string> {
  const db = env.DB;
  const isSandbox = !env.ENVIRONMENT || env.ENVIRONMENT !== 'production';
  const environmentStr = isSandbox ? 'sandbox' : 'production';

  // 1. Verifica se já temos o mapeamento local em asaas_customers
  const existingMap = await db
    .prepare(
      'SELECT asaas_customer_id FROM asaas_customers WHERE user_id = ? AND environment = ?',
    )
    .bind(userId, environmentStr)
    .first<{ asaas_customer_id: string }>();

  if (existingMap?.asaas_customer_id) {
    return existingMap.asaas_customer_id;
  }

  // 2. Busca dados do usuário e perfil
  const userRow = await db
    .prepare(
      `SELECT u.email, p.full_name, p.cpf_cnpj, p.phone 
       FROM users u 
       LEFT JOIN profiles p ON p.user_id = u.id 
       WHERE u.id = ?`,
    )
    .bind(userId)
    .first<{ email: string; full_name?: string | null; cpf_cnpj?: string | null; phone?: string | null }>();

  if (!userRow) {
    throw new DomainError('USER_NOT_FOUND', 'Usuário não encontrado para faturamento.', 404);
  }

  const rawCpfCnpj = input.cpfCnpj || userRow.cpf_cnpj;
  const fullName = input.name || userRow.full_name || 'Cliente Photo Studio AI';
  const phone = input.phone || userRow.phone || undefined;

  if (!rawCpfCnpj) {
    throw new DomainError(
      'CPF_CNPJ_REQUIRED',
      'CPF ou CNPJ é obrigatório para emissão de cobrança no Asaas.',
      422,
    );
  }

  const cleanCpfCnpj = rawCpfCnpj.replace(/\D/g, '');
  if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
    throw new DomainError('INVALID_CPF_CNPJ', 'CPF ou CNPJ inválido.', 422);
  }

  // 3. Atualiza perfil do usuário com CPF/CNPJ e nome se ainda não estiver preenchido
  await db
    .prepare(
      `UPDATE profiles 
       SET cpf_cnpj = COALESCE(cpf_cnpj, ?), 
           full_name = COALESCE(full_name, ?), 
           phone = COALESCE(phone, ?),
           updated_at = ? 
       WHERE user_id = ?`,
    )
    .bind(cleanCpfCnpj, fullName, phone ?? null, nowIso(), userId)
    .run();

  // 4. Verifica se o cliente já existe no Asaas pelo CPF/CNPJ
  let asaasCustomer: AsaasCustomer | null = await client.findCustomerByCpfCnpj(cleanCpfCnpj);

  if (!asaasCustomer) {
    // 5. Cria cliente no Asaas
    asaasCustomer = await client.createCustomer({
      name: fullName,
      cpfCnpj: cleanCpfCnpj,
      email: userRow.email,
      mobilePhone: phone,
      externalReference: userId,
    });
  }

  // 6. Vincula na tabela asaas_customers
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO asaas_customers (user_id, asaas_customer_id, environment, created_at) 
       VALUES (?, ?, ?, ?) 
       ON CONFLICT (user_id) DO UPDATE SET asaas_customer_id = ?, environment = ?`,
    )
    .bind(userId, asaasCustomer.id, environmentStr, now, asaasCustomer.id, environmentStr)
    .run();

  return asaasCustomer.id;
}
