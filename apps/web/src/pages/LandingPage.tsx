import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Logo,
  ThemeToggle,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  BeforeAfterSlider,
  PriceCard,
  LegalModal,
} from '@/design-system';
import {
  Sparkles,
  Scissors,
  Wand2,
  ShieldCheck,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Layers,
  Clock,
  Download,
  Lock,
  Camera,
  Coins,
  FileText,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');
  const [pricingTab, setPricingTab] = useState<'packs' | 'plans'>('packs');

  const [livePlans, setLivePlans] = useState<any[]>([]);
  const [liveProducts, setLiveProducts] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    api.billing
      .getCatalog()
      .then((res) => {
        if (!isMounted) return;
        if (res?.plans) setLivePlans(res.plans);
        if (res?.products) setLiveProducts(res.products);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Amostras de alta qualidade para o comparador Before/After
  const heroOriginal =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80';
  const heroEnhanced =
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80';

  const toolCategories = [
    {
      name: 'Remoção & Fundo',
      icon: <Scissors className="h-5 w-5 text-primary" />,
      description: 'Recortes precisos com máscara de cabelo e transparência pura.',
      tools: [
        { name: 'Remover Fundo', desc: 'Isolamento perfeito do assunto principal' },
        { name: 'Fundo Transparente', desc: 'Exportação em canal alfa PNG sem serrilhado' },
        { name: 'Substituir Fundo', desc: 'Troque por cenários de estúdio, praia ou urbano' },
        { name: 'Remover Pessoas', desc: 'Elimine pedestres e figurantes indesejados' },
        { name: 'Remover Objetos', desc: 'Apague fios, placas, manchas e reflexos' },
      ],
    },
    {
      name: 'Qualidade & Restauração',
      icon: <Sparkles className="h-5 w-5 text-amber-500" />,
      description: 'Elevação óptica profissional e preservação de texturas originais.',
      tools: [
        { name: 'Melhorar Iluminação', desc: 'Luz de estúdio tridimensional e balanceamento' },
        { name: 'Aprimorar Cores', desc: 'Gradação cinematográfica e balanço de branco' },
        { name: 'Nitidez & Clareza', desc: 'Realce de microporos, olhos e texturas finas' },
        { name: 'Restaurar Foto Antiga', desc: 'Recupera fotos analógicas rasgadas ou desbotadas' },
      ],
    },
    {
      name: 'Comercial & Criativo',
      icon: <Wand2 className="h-5 w-5 text-indigo-400" />,
      description: 'Potencialize fotos de produtos e e-commerce para conversão.',
      tools: [
        { name: 'Foto de Produto E-commerce', desc: 'Pedestais, sombras de estúdio e reflexos' },
        { name: 'Adicionar Elementos', desc: 'Insira adereços e efeitos com luz coerente' },
        { name: 'Substituir Elementos', desc: 'Altere roupas, materiais e cores' },
        { name: 'Variações Criativas', desc: 'Novos ângulos mantendo identidade visual' },
        { name: 'Prompt Livre IA', desc: 'Controle absoluto por linguagem natural em português' },
      ],
    },
  ];

  const faqs = [
    {
      q: 'Quais métodos de pagamento são aceitos?',
      a: 'Aceitamos Pix com liberação instantânea via QR Code dinâmico e Cartão de Crédito. Todos os pagamentos são processados com segurança de ponta pelo Asaas.',
    },
    {
      q: 'Minhas fotos são usadas para treinar modelos de inteligência artificial?',
      a: 'Nunca. Respeitamos integralmente a LGPD. Seus uploads e edições são mantidos em buckets privados Cloudflare R2 com URLs temporárias HMAC e nunca são compartilhados ou usados em datasets de treino.',
    },
    {
      q: 'Como funciona a retenção de 90 dias?',
      a: 'Garantimos 90 dias de guarda segura para você trabalhar em suas versões e exportar os arquivos. Você pode baixar em PNG, JPG ou WebP a qualquer momento ou solicitar a exclusão antecipada permanente com 1 clique.',
    },
    {
      q: 'Qual o valor dos créditos?',
      a: 'Você pode testar com a edição avulsa por R$ 7,90 (1 crédito válido por 30 dias), ou adquirir pacotes com até 50% de economia (créditos válidos por 12 meses) e assinaturas recorrentes.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
              <Logo size="md" />
            </a>
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
              <a href="#recursos" className="hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#ferramentas" className="hover:text-foreground transition-colors">
                As 14 Ferramentas
              </a>
              <a href="#precos" className="hover:text-foreground transition-colors">
                Preços & Créditos
              </a>
              <a href="#seguranca" className="hover:text-foreground transition-colors">
                Segurança LGPD
              </a>
              <button
                type="button"
                onClick={() => { setLegalModalTab('terms'); setLegalModalOpen(true); }}
                className="hover:text-foreground transition-colors"
              >
                Termos
              </button>
              <button
                type="button"
                onClick={() => { setLegalModalTab('privacy'); setLegalModalOpen(true); }}
                className="hover:text-foreground transition-colors"
              >
                Privacidade
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Meu Studio
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth/login')}>
                  Entrar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/auth/register')}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Começar Agora
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
            <Badge variant="gold" size="md" className="gap-1.5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              Tecnologia Fotográfica de Ponta para E-commerce e Criadores
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Edição de fotos profissional em segundos com{' '}
              <span className="bg-gradient-to-r from-primary via-indigo-400 to-amber-400 bg-clip-text text-transparent">
                IA de estúdio
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Remova fundos, aprimore iluminação, recupere fotos antigas e crie imagens de produto cinematográficas com controle não-destrutivo e transparência absoluta de créditos.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                variant="gold"
                size="lg"
                leftIcon={<Camera className="h-5 w-5" />}
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth/register')}
                className="shadow-lg shadow-amber-500/10 font-bold"
              >
                Experimentar no Studio
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const el = document.getElementById('ferramentas');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ver Todas as 14 Ferramentas
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground pt-4">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Edição avulsa por apenas R$ 7,90
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Retenção privativa de 90 dias
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Exportação em PNG, JPG e WebP
              </span>
            </div>
          </div>

          {/* Comparador Interativo de Amostra no Hero */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
            <div className="p-3 bg-secondary/50 border-b border-border/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Demonstração Interativa: Restauração & Balanço de Cor
              </span>
              <span className="text-muted-foreground">Arraste a barra para comparar</span>
            </div>
            <div className="aspect-[16/10] sm:aspect-[16/9] w-full">
              <BeforeAfterSlider
                beforeImage={heroOriginal}
                afterImage={heroEnhanced}
                beforeLabel="Foto Original"
                afterLabel="Restauração com IA"
                initialPosition={50}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Seção 2: As 14 Ferramentas Especializadas */}
      <section id="ferramentas" className="py-20 border-b border-border/60 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="secondary">Cockpit Criativo</Badge>
            <h2 className="text-3xl font-bold tracking-tight">14 Ferramentas Especializadas em Estúdio</h2>
            <p className="text-sm text-muted-foreground">
              Cada motor de IA foi meticulosamente calibrado para tarefas específicas de edição sem distorção dos pixels essenciais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {toolCategories.map((cat) => (
              <Card key={cat.name} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="p-3 w-fit rounded-xl bg-secondary mb-3">{cat.icon}</div>
                  <CardTitle className="text-lg">{cat.name}</CardTitle>
                  <CardDescription className="text-xs">{cat.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cat.tools.map((t) => (
                    <div key={t.name} className="p-2.5 rounded-lg bg-secondary/40 border border-border/50 text-xs">
                      <span className="font-semibold text-foreground block">{t.name}</span>
                      <span className="text-[11px] text-muted-foreground">{t.desc}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seção 3: Recursos de Destaque */}
      <section id="recursos" className="py-20 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <Badge variant="secondary">Engenharia Editorial</Badge>
            <h2 className="text-3xl font-bold tracking-tight">Desenvolvido para Fluxos de Trabalho Reais</h2>
            <p className="text-sm text-muted-foreground">
              Nada de filtros superficiais. O Photo Studio AI entrega ferramentas utilitárias com rigor profissional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-5 space-y-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm">Histórico Não-Destrutivo</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sua imagem original de upload (v1) permanece intocada. Cada nova edição gera ramificações seguras com histórico de prompts.
              </p>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 w-fit">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm">Retenção de 90 Dias</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Acesso contínuo aos seus arquivos pelo período ideal de entrega de projetos com alertas graduais de retenção.
              </p>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 w-fit">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm">Download Multi-formato</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Exporte instantaneamente em PNG transparente, JPG otimizado ou WebP direto no navegador com renderização via Canvas.
              </p>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 w-fit">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm">Transparência de Créditos</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cotação visual antes de confirmar. Se houver falha de rede ou do modelo, os créditos voltam integralmente para sua carteira.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Seção 4: Segurança & LGPD */}
      <section id="seguranca" className="py-20 border-b border-border/60 bg-card/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-2xl border border-border bg-gradient-to-b from-card to-secondary/30 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Privacidade & Conformidade com a LGPD</h2>
                <p className="text-xs text-muted-foreground">Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-background/80 border border-border/60 space-y-1">
                <span className="font-bold text-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Imagens 100% Privativas
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  Arquivos protegidos no Cloudflare R2 com URLs assinadas por chave HMAC vinculadas exclusivamente à sua sessão.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-background/80 border border-border/60 space-y-1">
                <span className="font-bold text-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Zero Treinamento com Seus Dados
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  Garantia contratual de que nenhuma foto enviada por você é utilizada para treinar modelos abertos de inteligência artificial.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-background/80 border border-border/60 space-y-1">
                <span className="font-bold text-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Direito de Exclusão Definitiva
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  Exclusão imediata da sua conta sob demanda ou expurgo físico automático dos seus arquivos de imagem após 90 dias de retenção segura.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-background/80 border border-border/60 space-y-1">
                <span className="font-bold text-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Isenção PCI de Cartão
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  Nenhum dado de cartão de crédito passa pelos nossos servidores. Todo o pagamento é intermediado de forma segura pelo Asaas.
                </p>
              </div>
            </div>

            {/* Acesso direto aos Termos e Privacidade na Landing Page */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLegalModalTab('privacy');
                  setLegalModalOpen(true);
                }}
                className="gap-2 text-xs"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Ler Política de Privacidade LGPD Completa
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLegalModalTab('terms');
                  setLegalModalOpen(true);
                }}
                className="gap-2 text-xs"
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                Ler Termos de Uso do Serviço
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 5: Preços e Planos (100% Sincronizado com Painel Admin) */}
      <section id="precos" className="py-20 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="gold" className="gap-1.5">
              <Coins className="h-3.5 w-3.5" />
              Planos Oficiais & Preços
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">Escolha o Plano Ideal para seu Fluxo de Criação</h2>
            <p className="text-sm text-muted-foreground">
              Créditos mensais cumulativos, acesso irrestrito às 14 ferramentas de IA e garantia de cancelamento sem fidelidade.
            </p>
          </div>

          {/* Alternador de Catálogo: Pacotes Avulsos vs Assinaturas Mensais */}
          <div className="flex justify-center">
            <div className="p-1 rounded-xl bg-secondary/80 border border-border inline-flex gap-1">
              <button
                type="button"
                onClick={() => setPricingTab('packs')}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition-all select-none flex items-center gap-2 ${
                  pricingTab === 'packs'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Coins className="h-3.5 w-3.5" />
                Pacotes de Créditos Avulsos (Sem mensalidade)
              </button>
              <button
                type="button"
                onClick={() => setPricingTab('plans')}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition-all select-none flex items-center gap-2 ${
                  pricingTab === 'plans'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Assinaturas Mensais Recorrentes
              </button>
            </div>
          </div>

          {/* Grade Dinâmica de Preços (Pacotes Avulsos ou Assinaturas Mensais) */}
          {(() => {
            if (pricingTab === 'packs') {
              const fallbackProducts = [
                {
                  code: 'single_edit',
                  name: 'Edição Avulsa',
                  description: '1 crédito para realizar 1 edição com inteligência artificial profissional.',
                  credits: 1,
                  price_cents: 790,
                  credit_validity_days: 30,
                },
                {
                  code: 'pack_inicial',
                  name: 'Pacote Inicial',
                  description: '5 créditos de edição em alta resolução válidos por 12 meses.',
                  credits: 5,
                  price_cents: 1990,
                  credit_validity_days: 365,
                },
                {
                  code: 'pack_criador',
                  name: 'Pacote Criador',
                  description: '12 créditos perfeitos para criadores de conteúdo e fotos profissionais.',
                  credits: 12,
                  price_cents: 3990,
                  credit_validity_days: 365,
                },
                {
                  code: 'pack_profissional',
                  name: 'Pacote Profissional',
                  description: '20 créditos para profissionais e marcas com o melhor custo por foto.',
                  credits: 20,
                  price_cents: 5990,
                  credit_validity_days: 365,
                },
              ];

              const activeProducts = liveProducts && liveProducts.length > 0 ? liveProducts : fallbackProducts;
              const gridCols =
                activeProducts.length <= 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
                  : activeProducts.length === 3
                  ? 'grid-cols-1 md:grid-cols-3 max-w-5xl'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl';

              return (
                <div className={`grid ${gridCols} gap-6 mx-auto`}>
                  {activeProducts.map((prod: any) => {
                    const priceCents = prod.price_cents ?? prod.priceCents ?? 0;
                    const credits = prod.credits ?? 1;
                    const validity = prod.credit_validity_days ?? prod.creditValidityDays ?? 365;
                    const isPopular = prod.code === 'pack_criador' || prod.code === 'pack_popular';

                    return (
                      <PriceCard
                        key={prod.id || prod.code}
                        name={prod.name}
                        description={prod.description || 'Pacote avulso de créditos para edição com IA.'}
                        priceFormatted={`R$ ${(priceCents / 100).toFixed(2).replace('.', ',')}`}
                        periodLabel="pagamento único"
                        creditsLabel={`${credits} ${credits === 1 ? 'Crédito' : 'Créditos'}`}
                        isPopular={isPopular}
                        features={[
                          `${credits} ${credits === 1 ? 'edição fotográfica' : 'edições fotográficas'} com IA`,
                          `Validade de ${validity} dias`,
                          'Sem mensalidade / Sem renovação automática',
                          'Acesso a todos os 70 comandos inteligentes',
                          'Download em PNG, JPG e WebP em alta definição',
                          'Retenção privativa de 90 dias',
                        ]}
                        buttonText={isAuthenticated ? 'Adquirir Créditos' : 'Comprar Agora'}
                        onSelect={() => navigate(isAuthenticated ? '/pricing' : '/auth/register')}
                      />
                    );
                  })}
                </div>
              );
            }

            const fallbackPlans = [
              {
                id: 'plan_pessoal',
                code: 'pessoal',
                name: 'Plano Pessoal',
                description: '15 créditos mensais para criadores individuais e fotos pessoais.',
                monthly_credits: 15,
                price_cents: 2990,
              },
              {
                id: 'plan_pro',
                code: 'pro',
                name: 'Plano Pro',
                description: '40 créditos mensais para lojas virtuais, fotógrafos e produção contínua.',
                monthly_credits: 40,
                price_cents: 6990,
              },
              {
                id: 'plan_business',
                code: 'business',
                name: 'Plano Business',
                description: '100 créditos mensais com maior economia por imagem para marcas e agências.',
                monthly_credits: 100,
                price_cents: 14990,
              },
            ];

            const activePlans = livePlans && livePlans.length > 0 ? livePlans : fallbackPlans;
            const gridCols =
              activePlans.length <= 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
                : activePlans.length === 3
                ? 'grid-cols-1 md:grid-cols-3 max-w-5xl'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl';

            return (
              <div className={`grid ${gridCols} gap-6 mx-auto`}>
                {activePlans.map((plan: any) => {
                  const priceCents = plan.price_cents ?? plan.priceCents ?? 0;
                  const credits = plan.monthly_credits ?? plan.monthlyCredits ?? 0;
                  const isPopular =
                    plan.code === 'pro' ||
                    plan.code === 'popular' ||
                    String(plan.name).toLowerCase().includes('pro') ||
                    String(plan.name).toLowerCase().includes('popular');

                  return (
                    <PriceCard
                      key={plan.id || plan.code}
                      name={plan.name}
                      description={plan.description || 'Plano de assinatura mensal recorrente com créditos automáticos.'}
                      priceFormatted={`R$ ${(priceCents / 100).toFixed(2).replace('.', ',')}`}
                      periodLabel="por mês"
                      creditsLabel={`${credits} Créditos / mês`}
                      isPopular={isPopular}
                      features={[
                        `${credits} créditos renovados todo mês`,
                        'Acesso completo aos 70 comandos de IA',
                        'Remoção de fundo com IA óptica',
                        'Histórico de versões não-destrutivo',
                        'Downloads em alta resolução (PNG, JPG, WebP)',
                        'Cancele quando quiser com 1 clique',
                      ]}
                      buttonText={isAuthenticated ? 'Assinar no Painel' : `Assinar ${plan.name}`}
                      onSelect={() => navigate(isAuthenticated ? '/pricing' : '/auth/register')}
                    />
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* Seção 6: FAQ */}
      <section className="py-20 border-b border-border/60 bg-card/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Perguntas Frequentes</h2>
            <p className="text-xs text-muted-foreground">Tudo o que você precisa saber sobre o Photo Studio AI</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold hover:bg-secondary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/80 bg-card/60 py-12 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo size="sm" />
            <span className="text-[11px]">
              Photo Studio AI — Todos os direitos reservados.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <a href="/auth/register" className="hover:text-foreground transition-colors">
              Criar Conta
            </a>
            <a href="/auth/login" className="hover:text-foreground transition-colors">
              Acessar Studio
            </a>
            <button
              type="button"
              onClick={() => { setLegalModalTab('terms'); setLegalModalOpen(true); }}
              className="hover:text-foreground transition-colors"
            >
              Termos de Uso
            </button>
            <button
              type="button"
              onClick={() => { setLegalModalTab('privacy'); setLegalModalOpen(true); }}
              className="hover:text-foreground transition-colors"
            >
              Privacidade LGPD
            </button>
            <a href="#precos" className="hover:text-foreground transition-colors">
              Preços & Créditos
            </a>
          </div>
        </div>
      </footer>

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
    </div>
  );
};
