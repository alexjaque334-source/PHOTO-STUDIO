import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Shield, FileText, CheckCircle2, Lock } from 'lucide-react';

export interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {activeTab === 'terms' ? <FileText className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {activeTab === 'terms' ? 'Termos de Uso' : 'Política de Privacidade & LGPD'}
            </h2>
            <p className="text-xs text-white/50">Versão 2026.1 • Em vigor e atualizada</p>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Retenção Segura de 90 dias • Zero Data Retention para Treino de IA</span>
          </div>
          <Button variant="primary" onClick={onClose} className="w-full sm:w-auto">
            Compreendi e Fechar
          </Button>
        </div>
      }
    >
      {/* Seletor de Abas */}
      <div className="flex border-b border-white/10 mb-5 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'terms'
              ? 'border-primary text-primary'
              : 'border-transparent text-white/60 hover:text-white hover:border-white/20'
          }`}
        >
          <FileText className="w-4 h-4" />
          Termos de Uso
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'privacy'
              ? 'border-primary text-primary'
              : 'border-transparent text-white/60 hover:text-white hover:border-white/20'
          }`}
        >
          <Shield className="w-4 h-4" />
          Política de Privacidade (LGPD)
        </button>
      </div>

      {/* Conteúdo com rolagem suave */}
      <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 text-sm text-white/80 leading-relaxed font-sans scrollbar-thin">
        {activeTab === 'terms' ? (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <h3 className="text-base font-semibold text-white">1. Objeto e Natureza da Plataforma</h3>
              <p>
                O <strong>Photo Studio AI</strong> é uma plataforma SaaS desenvolvida para realizar edições, aprimoramentos
                e ensaios fotográficos por meio de inteligência artificial generativa baseada em interpretação de linguagem
                natural em português brasileiro informal.
              </p>
              <p>
                Ao criar uma conta ou utilizar os serviços, você concorda integralmente com estes Termos de Uso.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">2. Cadastro e Segurança de Acesso</h3>
              <p>
                O acesso à plataforma requer cadastro com endereço de e-mail válido e senha segura.
                O usuário é o único responsável pela guarda de suas credenciais de acesso. Recomendamos veementemente
                a ativação da Autenticação em Duas Etapas (AFA/2FA) disponível nas configurações da sua conta.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">3. Regras de Conduta e Tolerância Zero (Anti-Abuso)</h3>
              <p>É expressamente proibido enviar imagens ou solicitar edições que envolvam:</p>
              <ul className="list-disc pl-5 space-y-1 text-white/70">
                <li>Exploração sexual infantil, pedofilia ou menores em trajes sumários (Art. 241 do ECA — Tolerância Zero e denúncia às autoridades competentes);</li>
                <li>Nudez não consensual (NCII), pornografia de vingança ou deepfakes íntimos sem consentimento explícito;</li>
                <li>Violência extrema, terrorismo, apologia a crimes ou fabricação de armas;</li>
                <li>Discurso de ódio, discriminação racial, religiosa, de gênero ou orientação sexual;</li>
                <li>Falsificação de documentos oficiais (RG, CNH, Passaporte, cartões de crédito).</li>
              </ul>
              <p className="text-xs text-amber-300">
                A violação destas regras acarretará banimento imediato da conta sem direito a reembolso e encaminhamento de registros ao Ministério Público e autoridades policiais.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">4. Créditos, Pagamentos e Reembolsos</h3>
              <p>
                As edições na plataforma consomem créditos que podem ser adquiridos via PIX instantâneo ou cartão de crédito.
                Antes de cada edição, a plataforma exibe um orçamento prévio e detalhado com a quantidade exata de créditos necessária.
              </p>
              <p>
                Caso ocorra qualquer erro de sistema que impeça a geração da fotografia, o saldo de créditos é estornado automaticamente para a sua carteira digital.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">5. Propriedade Intelectual e Direitos das Imagens</h3>
              <p>
                O usuário declara ser o legítimo titular dos direitos de imagem das fotografias enviadas ou possuir autorização legal para sua edição.
                As fotografias geradas pela IA pertencem ao usuário para uso pessoal ou comercial, observada a legislação vigente.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">6. Retenção e Ciclo de Vida dos Arquivos</h3>
              <p>
                Em conformidade com as melhores práticas de privacidade e segurança, os arquivos originais e gerados permanecem disponíveis para download no armazenamento privado pelo prazo máximo de <strong>90 dias</strong>, após o qual são definitivamente excluídos dos nossos servidores.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <h3 className="text-base font-semibold text-white">1. Compromisso com a Privacidade e LGPD</h3>
              <p>
                Esta Política de Privacidade descreve como o <strong>Photo Studio AI</strong> coleta, utiliza, armazena
                e protege seus dados pessoais em total conformidade com a <strong>Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018 - LGPD)</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">2. Garantia de Zero Data Retention (ZDR) na IA</h3>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Garantia Estrita de ZDR:</strong> Suas fotografias NUNCA são utilizadas para treinar, retreinar
                  ou aprimorar modelos de inteligência artificial externos. As conexões são processadas de forma efêmera e protegida por contratos empresariais com restrição de retenção.
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">3. Dados Pessoais Coletados e Finalidades</h3>
              <ul className="list-disc pl-5 space-y-1 text-white/70">
                <li><strong>Identificação e Contato:</strong> Nome e endereço de e-mail, utilizados para criação e autenticação da conta de usuário.</li>
                <li><strong>Fotografias e Imagens:</strong> Fornecidas voluntariamente para execução do serviço de edição fotográfica contratado.</li>
                <li><strong>Transações e Cobrança:</strong> Registro de aquisição de pacotes de créditos processados via operadora financeira credenciada (Asaas), sem armazenamento direto de dados bancários completos no nosso servidor.</li>
                <li><strong>Registros de Conexão:</strong> Endereço IP, data e hora de acesso, mantidos em cumprimento ao Art. 15 do Marco Civil da Internet (Lei 12.965/2014).</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">4. Direitos do Titular de Dados (Art. 18 da LGPD)</h3>
              <p>Você pode exercer a qualquer momento os seus direitos assegurados por lei:</p>
              <ul className="list-disc pl-5 space-y-1 text-white/70">
                <li>Confirmação da existência de tratamento e acesso aos seus dados;</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
                <li>Exclusão definitiva de conta e dados pessoais tratados sob consentimento;</li>
                <li>Revogação do consentimento concedido.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">5. Armazenamento Seguro e Política de Retenção de 90 Dias</h3>
              <p>
                Todos os dados são transmitidos sob criptografia TLS 1.3 e armazenados em infraestrutura de borda (Edge Cloudflare) com criptografia AES-256 em repouso.
                Os arquivos de imagem originais e gerados são mantidos pelo prazo operacional de 90 dias, findo o qual são expurgados de forma irreversível.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">6. Canal de Contato com o DPO / Encarregado de Dados</h3>
              <p>
                Para exercer qualquer um dos seus direitos ou esclarecer dúvidas sobre o tratamento de dados pessoais, entre em contato diretamente com o nosso Encarregado de Proteção de Dados:
              </p>
              <p className="text-primary font-medium">
                E-mail: <a href="mailto:privacidade@photostudio.ai" className="underline hover:text-primary-light">privacidade@photostudio.ai</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
