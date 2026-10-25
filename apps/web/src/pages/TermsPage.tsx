import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo, Button } from '@/design-system';
import { ArrowLeft, Shield, FileText, CheckCircle2, Lock } from 'lucide-react';

export const TermsPage: React.FC = () => {
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
              onClick={() => navigate('/privacidade')}
              className="hidden sm:inline-flex gap-2"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              Privacidade LGPD
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <FileText className="w-3.5 h-3.5" />
            Contrato de Licença e Uso
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Termos de Uso do Serviço
          </h1>
          <p className="text-white/60 text-sm">
            Última atualização: 25 de Outubro de 2026 • Versão 2026.1
          </p>
        </div>

        <div className="space-y-8 bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-10 text-white/80 leading-relaxed text-sm">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              1. Identificação do Serviço e Aceitação
            </h2>
            <p>
              Estes Termos de Uso regem o acesso e a utilização da plataforma <strong>Photo Studio AI</strong>,
              uma solução de software como serviço (SaaS) especializada na edição, aprimoramento e geração de fotografias
              através de inteligência artificial de alta precisão baseada em comandos em linguagem natural simplificada.
            </p>
            <p>
              Ao registrar uma conta, adquirir créditos ou utilizar qualquer uma de nossas funcionalidades, você expressa
              sua total e inequívoca concordância com estes termos. Se você não concordar com qualquer cláusula, deverá cessar
              imediatamente o uso da plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              2. Cadastro, Acesso e Segurança da Conta
            </h2>
            <p>
              Para utilizar os recursos de edição, o usuário deve criar uma conta pessoal informando um e-mail válido e uma senha forte.
              O usuário é inteiramente responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.
            </p>
            <p>
              A plataforma disponibiliza mecanismo de <strong>Autenticação em Duas Etapas (AFA/2FA)</strong>. A ativação deste recurso
              é fortemente encorajada para resguardar a integridade e privacidade da conta.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 text-rose-400">
              3. Diretrizes de Uso Aceitável e Tolerância Zero (Anti-Abuso)
            </h2>
            <p>
              O Photo Studio AI adota uma política rigorosa de respeito à dignidade humana e às leis brasileiras e internacionais. É estritamente proibido:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/70">
              <li>
                <strong>Exploração Sexual Infantil (CSAM):</strong> Qualquer tentativa de envio, geração ou manipulação de imagens contendo menores de idade em contextos sexuais, sensuais ou degradantes (Art. 241 do Estatuto da Criança e do Adolescente). Ocorrências desse tipo implicam banimento imediato e notificação imediata às autoridades policiais competentes.
              </li>
              <li>
                <strong>Nudez Não Consensual (NCII) e Deepfakes:</strong> Manipulação de imagens de terceiros sem consentimento documentado para simular nudez ou atos íntimos (Art. 216-B do Código Penal Brasileiro).
              </li>
              <li>
                <strong>Violência e Terrorismo:</strong> Imagens de mutilação, apologia a crimes violently graves, fabricação de armas ou explosivos.
              </li>
              <li>
                <strong>Discurso de Ódio e Discriminação:</strong> Incitação ao preconceito de raça, etnia, religião, orientação sexual ou gênero.
              </li>
              <li>
                <strong>Falsificação Documental:</strong> Criação de documentos de identidade (RG, CNH, Passaporte) ou instrumentos fraudulentos de pagamento.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              4. Sistema de Créditos, Faturamento e Estorno
            </h2>
            <p>
              Os serviços de edição operam mediante consumo de créditos. Antes de cada operação, o sistema exibe o custo exato em créditos ou reais, exigindo confirmação explícita do usuário.
            </p>
            <p>
              Em caso de erro técnico imputável aos nossos servidores que impeça a geração da imagem, os créditos debitados são automaticamente restituídos à carteira do usuário.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              5. Propriedade Intelectual e Licença de Imagens
            </h2>
            <p>
              O usuário garante que possui todos os direitos ou autorizações necessárias sobre as fotografias enviadas.
              As imagens resultantes geradas pela IA pertencem ao usuário, outorgando-lhe licença irrestrita de uso comercial e pessoal, ressalvada a conformidade com as leis vigentes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              6. Retenção e Descarte Seguro de 90 Dias
            </h2>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Política de Retenção Segura</strong>
                <p className="text-white/70 text-xs">
                  Os arquivos originais e gerados permanecem disponíveis na sua conta pelo período máximo de <strong>90 dias</strong>,
                  armazenados com criptografia de ponta a ponta no Cloudflare R2 privado. Após esse período, os arquivos são física e permanentemente eliminados dos nossos servidores de armazenamento.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              7. Foro e Legislação Aplicável
            </h2>
            <p>
              Estes Termos são regidos exclusivamente pelas leis da República Federativa do Brasil, em particular o Marco Civil da Internet (Lei nº 12.965/2014) e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};
