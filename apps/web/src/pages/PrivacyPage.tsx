import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo, Button } from '@/design-system';
import { ArrowLeft, Shield, FileText, CheckCircle2, Lock, Mail } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#090B10] text-white selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#090B10]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div className="h-4 w-px bg-white/10" />
            <Logo size="md" />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/termos')}
              className="hidden sm:inline-flex gap-2"
            >
              <FileText className="w-4 h-4 text-primary" />
              Termos de Uso
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/auth/register')}
            >
              Criar Conta Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            Conformidade LGPD (Lei Federal nº 13.709/2018)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Política de Privacidade & Proteção de Dados
          </h1>
          <p className="text-white/60 text-sm">
            Última atualização: 25 de Outubro de 2026 • Versão 2026.1
          </p>
        </div>

        <div className="space-y-8 bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-10 text-white/80 leading-relaxed text-sm">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              1. Visão Geral e Compromisso de Privacidade
            </h2>
            <p>
              O <strong>Photo Studio AI</strong> leva a privacidade de seus usuários com o mais elevado rigor técnico e jurídico.
              Esta Política esclarece detalhadamente como coletamos, tratamos, protegemos e descartamos seus dados pessoais e fotografias,
              em observância integral à <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong> e às diretrizes da
              <strong> Autoridade Nacional de Proteção de Dados (ANPD)</strong>.
            </p>
          </section>

          {/* Destaque ZDR */}
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-white space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              Garantia de Zero Data Retention (ZDR) na Inteligência Artificial
            </div>
            <p className="text-white/80 text-xs leading-relaxed">
              Diferente de serviços convencionais de IA gratuita, o Photo Studio AI assegura formalmente que <strong>suas fotografias e prompts NUNCA são utilizados para alimentar ou treinar modelos generativos externos</strong>. Todo o processamento de inferência é efêmero, restrito exclusivamente à entrega da fotografia editada que você solicitou.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              2. Dados Coletados e Base Legal
            </h2>
            <p>Tratamos apenas os dados estritamente necessários para viabilizar os serviços contratados:</p>
            <ul className="list-disc pl-6 space-y-2 text-white/70">
              <li>
                <strong>Dados Cadastrais:</strong> Nome e e-mail (Base Legal: Execução de Contrato - Art. 7º, V da LGPD).
              </li>
              <li>
                <strong>Fotografias Enviadas e Geradas:</strong> Processadas exclusivamente para aplicação dos efeitos de IA requisitados pelo próprio titular (Base Legal: Execução de Contrato - Art. 7º, V da LGPD).
              </li>
              <li>
                <strong>Dados de Faturamento:</strong> Registro de aquisição de créditos (processados de forma segura e tokenizada através da instituição de pagamento regulamentada Asaas).
              </li>
              <li>
                <strong>Registros de Conexão:</strong> Endereço IP, data, horário e agente de usuário (Base Legal: Cumprimento de Obrigação Legal - Art. 15 do Marco Civil da Internet).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              3. Direitos do Titular de Dados Pessoais (Art. 18 LGPD)
            </h2>
            <p>
              Você é o proprietário de seus dados. A qualquer tempo, sem custos, você pode exercer diretamente através do nosso painel ou via canal de DPO:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <strong className="text-white block text-xs mb-1">Acesso e Confirmação</strong>
                <span className="text-white/60 text-xs">Confirmar e visualizar todos os seus dados cadastrados.</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <strong className="text-white block text-xs mb-1">Retificação</strong>
                <span className="text-white/60 text-xs">Corrigir dados cadastrais incorretos ou incompletos.</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <strong className="text-white block text-xs mb-1">Exclusão Definitiva</strong>
                <span className="text-white/60 text-xs">Solicitar a exclusão integral de sua conta e histórico.</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <strong className="text-white block text-xs mb-1">Revogação de Consentimento</strong>
                <span className="text-white/60 text-xs">Revogar permissões previamente outorgadas a qualquer momento.</span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              4. Armazenamento e Política de Retenção de 90 Dias
            </h2>
            <p>
              Seus arquivos originais e gerados contam com armazenamento seguro e privado no Cloudflare R2 com criptografia AES-256.
              A fim de evitar acúmulo desnecessário de dados e proteger sua privacidade, adotamos um ciclo de vida estrito de <strong>90 dias de retenção máxima</strong>. Após 90 dias, os arquivos são eliminados fisicamente de maneira irrecuperável.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              5. Segurança da Informação e Mitigação de Riscos
            </h2>
            <p>
              Empregamos salvaguardas técnicas e organizacionais de padrão internacional:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-white/70">
              <li>Criptografia completa em trânsito com protocolo TLS 1.3 obrigatório;</li>
              <li>Proteção contra ataques volumétricos, força bruta e injeções maliciosas;</li>
              <li>Hash de senhas de última geração baseado em PBKDF2 com salt criptográfico único;</li>
              <li>Permissões de câmera e microfone estritamente controladas pelo navegador do usuário com opção de revogação imediata.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              6. Canal de Atendimento e Encarregado de Proteção de Dados (DPO)
            </h2>
            <p>
              Para solicitações relacionadas a esta Política, exercício de direitos da LGPD ou esclarecimentos gerais sobre proteção de dados, disponibilizamos nosso canal oficial:
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0" />
              <div>
                <span className="text-xs text-white/50 block">Encarregado pelo Tratamento de Dados Pessoais (DPO):</span>
                <a href="mailto:privacidade@photostudio.ai" className="text-white font-semibold hover:text-primary transition-colors text-sm">
                  privacidade@photostudio.ai
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
