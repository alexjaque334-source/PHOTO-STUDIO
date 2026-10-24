/**
 * Serviço de e-mail com adaptador Resend e fallback local para outbox.
 * Dono: Backend Engineer
 */
import type { Env } from '../env';
import { execute } from '../db';
import { newId, nowIso } from '../lib/http';

export type EmailTemplate =
  | 'verification'
  | 'password_reset'
  | 'retention_warning_7d'
  | 'retention_warning_1d'
  | 'edit_completed'
  | 'account_deletion_scheduled';

export interface EmailOptions {
  to: string;
  template: EmailTemplate;
  payload: Record<string, unknown>;
  userId?: string;
}

export function renderEmailTemplate(
  template: EmailTemplate,
  payload: Record<string, unknown>,
  appUrl: string,
): { subject: string; html: string; text: string } {
  switch (template) {
    case 'verification': {
      const token = String(payload.token ?? '');
      const link = `${appUrl}/verify-email?token=${token}`;
      return {
        subject: 'Confirme seu endereço de e-mail — Photo Studio AI',
        text: `Olá!\n\nConfirme seu e-mail no Photo Studio AI clicando no link abaixo:\n${link}\n\nEste link é válido por 24 horas.\nSe você não solicitou este cadastro, desconsidere esta mensagem.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #6366f1;">Bem-vindo ao Photo Studio AI</h2>
            <p>Obrigado por se cadastrar. Confirme seu e-mail para ativar sua conta e usufruir de todos os recursos de edição com inteligência artificial.</p>
            <p style="margin: 30px 0;">
              <a href="${link}" style="background-color: #6366f1; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirmar meu E-mail</a>
            </p>
            <p style="font-size: 13px; color: #666;">Ou acesse diretamente pelo link: <br><a href="${link}">${link}</a></p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
            <p style="font-size: 12px; color: #999;">Photo Studio AI. Todos os direitos reservados.</p>
          </div>
        `,
      };
    }

    case 'password_reset': {
      const token = String(payload.token ?? '');
      const link = `${appUrl}/reset-password?token=${token}`;
      return {
        subject: 'Redefinição de senha — Photo Studio AI',
        text: `Olá!\n\nRecebemos uma solicitação para redefinir a senha da sua conta.\n\nClique no link abaixo para cadastrar uma nova senha:\n${link}\n\nEste link expira em 1 hora.\nSe não foi você quem solicitou, sua conta continua segura e você pode ignorar este e-mail.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #6366f1;">Redefinição de Senha</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no Photo Studio AI.</p>
            <p style="margin: 30px 0;">
              <a href="${link}" style="background-color: #6366f1; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Redefinir Senha</a>
            </p>
            <p style="font-size: 13px; color: #666;">Se o botão não funcionar, copie este link no seu navegador: <br><a href="${link}">${link}</a></p>
            <p style="font-size: 13px; color: #999;">O link é válido por 1 hora. Se não foi você, ignore este e-mail.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
            <p style="font-size: 12px; color: #999;">Photo Studio AI</p>
          </div>
        `,
      };
    }

    case 'retention_warning_7d': {
      const days = payload.days ?? 7;
      const link = `${appUrl}/dashboard`;
      return {
        subject: `Aviso de Retenção: Fotos expiram em ${days} dias — Photo Studio AI`,
        text: `Olá!\n\nAlgumas de suas fotos no Photo Studio AI atingirão a política de retenção de 90 dias e serão excluídas em ${days} dias.\n\nAcesse sua galeria para baixá-las antes da remoção definitiva:\n${link}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #f59e0b;">Aviso de Retenção de Fotos</h2>
            <p>Em conformidade com nossa política de privacidade e retenção de 90 dias, você possui fotos na plataforma que serão excluídas definitivamente em <strong>${days} dias</strong>.</p>
            <p>Baixe suas fotos editadas e originais antes do encerramento do prazo.</p>
            <p style="margin: 30px 0;">
              <a href="${link}" style="background-color: #f59e0b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Acessar Minha Galeria</a>
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
            <p style="font-size: 12px; color: #999;">Photo Studio AI</p>
          </div>
        `,
      };
    }

    case 'retention_warning_1d': {
      const link = `${appUrl}/dashboard`;
      return {
        subject: 'Último aviso: Suas fotos expiram amanhã — Photo Studio AI',
        text: `Olá!\n\nSuas fotos atingirão o prazo de 90 dias e serão excluídas amanhã de forma permanente e irreversível.\n\nBaixe seus arquivos agora: ${link}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #ef4444;">Último Aviso: Suas fotos serão excluídas amanhã</h2>
            <p>Suas fotos atingiram a validade de 90 dias e serão permanentemente deletadas do servidor em menos de 24 horas.</p>
            <p style="margin: 30px 0;">
              <a href="${link}" style="background-color: #ef4444; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Fazer Download Imediato</a>
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
            <p style="font-size: 12px; color: #999;">Photo Studio AI</p>
          </div>
        `,
      };
    }

    case 'edit_completed': {
      const imageId = String(payload.imageId ?? '');
      const link = `${appUrl}/images/${imageId}`;
      return {
        subject: 'Sua foto foi editada com sucesso! — Photo Studio AI',
        text: `Olá!\n\nA inteligência artificial concluiu a edição da sua imagem.\nVeja o resultado agora em: ${link}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #10b981;">Edição Concluída!</h2>
            <p>A edição com IA solicitada foi processada com sucesso. Acesse o estúdio para visualizar e baixar sua nova versão em alta definição.</p>
            <p style="margin: 30px 0;">
              <a href="${link}" style="background-color: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver Minha Foto Editada</a>
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
            <p style="font-size: 12px; color: #999;">Photo Studio AI</p>
          </div>
        `,
      };
    }

    case 'account_deletion_scheduled': {
      const scheduledFor = String(payload.scheduledFor ?? '');
      return {
        subject: 'Solicitação de exclusão de conta recebida — Photo Studio AI',
        text: `Olá!\n\nRecebemos sua solicitação de exclusão de conta. Seus arquivos de imagem foram removidos e seus dados pessoais serão anonimizados em definitivo até ${scheduledFor}.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2>Confirmação de Solicitação de Exclusão</h2>
            <p>Confirmamos o recebimento da sua solicitação de exclusão de conta e dados pessoais conforme a LGPD.</p>
            <p>Suas fotos foram removidas de nossos servidores de mídia e sua conta será anonimizada em definitivo em ${scheduledFor}.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
            <p style="font-size: 12px; color: #999;">Photo Studio AI</p>
          </div>
        `,
      };
    }
  }
}

export async function sendEmail(env: Env, options: EmailOptions): Promise<void> {
  const { to, template, payload, userId } = options;
  const outboxId = newId();
  const now = nowIso();
  const rendered = renderEmailTemplate(template, payload, env.APP_URL);

  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM || 'Photo Studio AI <exemplo25@gmail.com>',
          to: [to],
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Resend API error (${res.status}): ${errorText}`);
      }

      await execute(
        env.DB,
        `INSERT INTO email_outbox (id, user_id, to_email, template, payload_json, status, attempts, created_at, sent_at)
         VALUES (?, ?, ?, ?, ?, 'sent', 1, ?, ?)`,
        [outboxId, userId ?? null, to, template, JSON.stringify(payload), now, now],
      );
      return;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Email] Falha ao enviar via Resend: ${errMsg}`);

      await execute(
        env.DB,
        `INSERT INTO email_outbox (id, user_id, to_email, template, payload_json, status, attempts, error, created_at)
         VALUES (?, ?, ?, ?, ?, 'failed', 1, ?, ?)`,
        [outboxId, userId ?? null, to, template, JSON.stringify(payload), errMsg, now],
      );
      return;
    }
  }

  // Fallback de desenvolvimento: grava na tabela email_outbox com status dev_logged e loga no console
  console.log(
    `[Email-DevOutbox] [To: ${to}] [Template: ${template}]\nAssunto: ${rendered.subject}\nTexto: ${rendered.text}`,
  );

  await execute(
    env.DB,
    `INSERT INTO email_outbox (id, user_id, to_email, template, payload_json, status, attempts, created_at, sent_at)
     VALUES (?, ?, ?, ?, ?, 'dev_logged', 1, ?, ?)`,
    [outboxId, userId ?? null, to, template, JSON.stringify(payload), now, now],
  );
}
