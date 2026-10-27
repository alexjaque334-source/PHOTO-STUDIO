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
  InstallAppModal,
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
  Heart,
  Sun,
  Video,
  ShoppingBag,
  PartyPopper,
  Smartphone,
  Apple,
  Chrome,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');
  const [installModalOpen, setInstallModalOpen] = useState(false);
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

  // 8 Tópicos Especializados do Cockpit (70 Ferramentas no Total)
  const cockpitTopics = [
    {
      title: 'Básico & Restauração',
      count: '14 Ferramentas',
      icon: <Scissors className="h-5 w-5 text-primary" />,
      description: 'Recortes perfeitos com canal alfa transparente, remoção de objetos indesejados, correção de luz e restauração de fotos analógicas antigas.',
    },
    {
      title: 'Ensaios & Retratos',
      count: '8 Ferramentas',
      icon: <Camera className="h-5 w-5 text-indigo-400" />,
      description: 'Retratos executivos para LinkedIn, ensaios de estúdio de alta definição, retratos femininos elegantes, gestante e infantil profissional.',
    },
    {
      title: 'Aniversários & Festas',
      count: '8 Ferramentas',
      icon: <PartyPopper className="h-5 w-5 text-pink-400" />,
      description: 'Cenários comemorativos para festas infantis, debutante 15 anos, smash the cake, celebrações ao ar livre e aniversários adultos sofisticados.',
    },
    {
      title: 'Casamentos & Noivas',
      count: '8 Ferramentas',
      icon: <Heart className="h-5 w-5 text-rose-400" />,
      description: 'Ensaios pré-wedding, cerimônias clássicas, pôr do sol na praia, detalhes do véu e retratos cinematográficos com iluminação dourada.',
    },
    {
      title: 'Natureza & Paisagens',
      count: '8 Ferramentas',
      icon: <Sun className="h-5 w-5 text-amber-400" />,
      description: 'Substituição por destinos turísticos dos sonhos, praias paradisíacas, montanhas dramáticas, cachoeiras e florestas místicas.',
    },
    {
      title: 'Eventos & Palcos',
      count: '8 Ferramentas',
      icon: <Video className="h-5 w-5 text-purple-400" />,
      description: 'Fotografias em palestras executivas, convenções de negócios, bailes de formatura, festivais de música e eventos de grande porte.',
    },
    {
      title: 'Motion & Efeitos Visuais',
      count: '8 Ferramentas',
      icon: <Wand2 className="h-5 w-5 text-cyan-400" />,
      description: 'Efeitos cinematográficos de gravidade zero, partículas douradas em suspensão, trilhas de luz neon e dinamismo visual de alta energia.',
    },
    {
      title: 'Comercial & E-commerce',
      count: '8 Ferramentas',
      icon: <ShoppingBag className="h-5 w-5 text-emerald-400" />,
      description: 'Imagens publicitárias de alto padrão para catálogos de produtos, gastronomia gourmet, cosméticos, joias e anúncios de conversão.',
    },
  ];

  // Amostras de alta qualidade para o comparador Before/After
  const heroOriginal =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80';
  const heroEnhanced =
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80';

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
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full max-w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <a href="/" className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md shrink-0">
              <div className="sm:hidden flex items-center gap-1.5">
                <Logo variant="mark" size="sm" />
                <span className="font-extrabold text-xs tracking-tight text-foreground">
                  PhotoStudio<span className="text-primary text-[10px] font-black ml-1 px-1 py-0.5 rounded bg-primary/10">AI</span>
                </span>
              </div>
              <div className="hidden sm:block">
                <Logo size="md" />
              </div>
            </a>
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
              <a href="#recursos" className="hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#ferramentas" className="hover:text-foreground transition-colors">
                Cockpit de 70 Comandos
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

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Botão Instalar App (Apple & Android) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInstallModalOpen(true)}
              leftIcon={<Smartphone className="h-4 w-4 text-primary" />}
              className="hidden sm:inline-flex border-primary/30 hover:border-primary/60 text-xs font-semibold"
            >
              Instalar App
            </Button>

            <ThemeToggle />
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="text-xs px-3 h-8 font-semibold shadow-xs"
              >
                Meu Estúdio
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/auth/login')}
                  className="text-xs px-2.5 h-8 font-semibold text-foreground hover:bg-secondary/70 transition-colors"
                >
                  Entrar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/auth/register')}
                  rightIcon={<ArrowRight className="h-3 w-3" />}
                  className="text-xs px-2.5 sm:px-3 h-8 font-semibold shadow-xs"
                >
                  Criar Conta
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 w-full max-w-full overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative overflow-hidden w-full max-w-full pt-8 pb-14 md:pt-20 md:pb-28 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
            <Badge variant="gold" size="md" className="gap-1.5 px-3 py-1 max-w-full text-center">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Tecnologia Fotográfica de Ponta</span>
            </Badge>

            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.2] break-words px-1">
              Edição de fotos profissional em segundos com{' '}
              <span className="bg-gradient-to-r from-primary via-indigo-400 to-amber-400 bg-clip-text text-transparent">
                IA de estúdio
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-2xl px-2">
              Remova fundos, aprimore iluminação, recupere fotos antigas e crie imagens de produto cinematográficas com controle não-destrutivo e transparência absoluta de créditos.
            </p>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center justify-center gap-3 pt-2 max-w-xs sm:max-w-none mx-auto">
              <Button
                variant="gold"
                size="lg"
                leftIcon={<Camera className="h-5 w-5" />}
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth/register')}
                className="w-full sm:w-auto shadow-lg shadow-amber-500/10 font-bold justify-center"
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
                className="w-full sm:w-auto justify-center"
              >
                Explorar os 70 Comandos
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-6 text-xs text-muted-foreground pt-3">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                Edição avulsa por apenas R$ 7,90
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                Retenção privativa de 90 dias
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                Exportação em PNG, JPG e WebP
              </span>
            </div>
          </div>

          {/* Comparador Interativo de Amostra no Hero */}
          <div className="mt-10 sm:mt-14 max-w-4xl mx-auto rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
            <div className="p-2.5 sm:p-3 bg-secondary/50 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Demonstração Interativa com IA</span>
              </span>
              <span className="text-muted-foreground text-[11px]">Arraste a barra para comparar</span>
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

      {/* Seção 2: Os 8 Tópicos Especializados do Cockpit */}
      <section id="ferramentas" className="py-14 md:py-20 border-b border-border/60 bg-card/30 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 md:space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="secondary" className="px-3 py-1 text-xs">Cockpit Criativo</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              70 Ferramentas em 8 Tópicos Especializados
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Você não precisa aprender termos técnicos de inteligência artificial. Basta pedir o que deseja em português simples no WhatsApp e o motor aplica a edição ideal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cockpitTopics.map((topic) => (
              <Card
                key={topic.title}
                className="flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-md bg-card/60 border-border/80 p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="p-3 w-fit rounded-xl bg-secondary/80 border border-border/50">
                      {topic.icon}
                    </div>
                    <Badge variant="outline" className="text-[11px] font-semibold border-primary/30 text-primary">
                      {topic.count}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                      {topic.description}
                    </p>
                  </div>
                </div>
                <div className="pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold justify-between group hover:border-primary/60 hover:bg-primary hover:text-primary-foreground transition-all"
                    onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
                  >
                    <span>Experimentar</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seção 3: Recursos de Destaque */}
      <section id="recursos" className="py-14 md:py-20 border-b border-border/60 w-full max-w-full overflow-hidden">
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
      <section id="seguranca" className="py-14 md:py-20 border-b border-border/60 bg-card/40 w-full max-w-full overflow-hidden">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="p-5 sm:p-8 md:p-10 rounded-2xl border border-border bg-gradient-to-b from-card to-secondary/30 space-y-6">
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
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-start gap-2.5 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLegalModalTab('privacy');
                  setLegalModalOpen(true);
                }}
                className="w-full sm:w-auto gap-2 text-xs justify-center"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Privacidade LGPD Completa</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLegalModalTab('terms');
                  setLegalModalOpen(true);
                }}
                className="w-full sm:w-auto gap-2 text-xs justify-center"
              >
                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Termos de Uso do Serviço</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 5: Preços e Planos (100% Sincronizado com Painel Admin) */}
      <section id="precos" className="py-14 md:py-20 border-b border-border/60 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-10 md:space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="gold" className="gap-1.5">
              <Coins className="h-3.5 w-3.5" />
              Planos Oficiais & Preços
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Escolha o Plano Ideal para seu Fluxo de Criação</h2>
            <p className="text-xs sm:text-sm text-muted-foreground px-2">
              Créditos cumulativos, acesso irrestrito aos 70 comandos inteligentes de IA e garantia de cancelamento sem fidelidade.
            </p>
          </div>

          {/* Alternador de Catálogo: Pacotes Avulsos vs Assinaturas Mensais */}
          <div className="flex justify-center px-2 w-full">
            <div className="p-1 rounded-xl bg-secondary/80 border border-border flex flex-col sm:flex-row w-full max-w-xs sm:max-w-md gap-1">
              <button
                type="button"
                onClick={() => setPricingTab('packs')}
                className={`w-full sm:w-auto flex-1 px-3 sm:px-5 py-2.5 rounded-lg text-xs font-semibold transition-all select-none flex items-center justify-center gap-1.5 ${
                  pricingTab === 'packs'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Coins className="h-3.5 w-3.5 shrink-0" />
                <span>Pacotes Avulsos</span>
              </button>
              <button
                type="button"
                onClick={() => setPricingTab('plans')}
                className={`w-full sm:w-auto flex-1 px-3 sm:px-5 py-2.5 rounded-lg text-xs font-semibold transition-all select-none flex items-center justify-center gap-1.5 ${
                  pricingTab === 'plans'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span>Assinaturas Mensais</span>
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
                  description: '1 foto avulsa para testar o estúdio com IA.',
                  credits: 1,
                  price_cents: 790,
                  credit_validity_days: 30,
                },
                {
                  code: 'pack_inicial',
                  name: 'Pacote Inicial',
                  description: '5 créditos de edição válidos por 12 meses.',
                  credits: 5,
                  price_cents: 1990,
                  credit_validity_days: 365,
                },
                {
                  code: 'pack_criador',
                  name: 'Pacote Criador',
                  description: '10 créditos para criadores e ensaios com 6 estilos de fotos.',
                  credits: 10,
                  price_cents: 3990,
                  credit_validity_days: 365,
                },
                {
                  code: 'pack_profissional',
                  name: 'Pacote Profissional',
                  description: '30 créditos para profissionais com todos os 8 tipos de fotos liberados.',
                  credits: 30,
                  price_cents: 7490,
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
                        features={(() => {
                          if (prod.code === 'single_edit') {
                            return [
                              '1 edição fotográfica com IA',
                              'Básico & Restauração + Ensaios & Retratos (2 tipos)',
                              'Retenção privativa de 30 dias',
                              'Download em alta definição (PNG, JPG, WebP)',
                              'Sem mensalidade / Sem renovação',
                            ];
                          }
                          if (prod.code === 'pack_inicial') {
                            return [
                              '5 edições fotográficas com IA',
                              '4 tipos (+ Aniversários & Festas, Casamentos)',
                              'Retenção privativa de 30 dias',
                              'Validade dos créditos de 1 ano',
                              'Download em alta definição (PNG, JPG, WebP)',
                            ];
                          }
                          if (prod.code === 'pack_criador') {
                            return [
                              '10 edições fotográficas com IA',
                              '6 tipos (+ Natureza & Paisagens, Eventos & Palco)',
                              'Retenção privativa de 30 dias',
                              'Validade dos créditos de 1 ano',
                              'Melhor custo-benefício para criadores',
                            ];
                          }
                          return [
                            '30 edições fotográficas com IA',
                            'Todos os 8 tipos de fotos (+ Comercial & E-commerce)',
                            'Retenção estendida de 50 dias',
                            'Validade dos créditos de 1 ano',
                            'Download em máxima definição comercial',
                          ];
                        })()}
                        buttonText={isAuthenticated ? 'Adquirir Créditos' : 'Comprar Agora'}
                        onSelect={() => {
                          const target = `/pricing?tab=packs&item=${encodeURIComponent(prod.code)}`;
                          if (isAuthenticated) {
                            navigate(target);
                          } else {
                            navigate(`/auth/login?redirect=${encodeURIComponent(target)}`);
                          }
                        }}
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
                description: '15 créditos mensais para fotos pessoais com 45 dias de histórico.',
                monthly_credits: 15,
                price_cents: 2990,
              },
              {
                id: 'plan_pro',
                code: 'pro',
                name: 'Plano Pro',
                description: '40 créditos mensais com Imagem Motion exclusiva e 60 dias de histórico.',
                monthly_credits: 40,
                price_cents: 6990,
              },
              {
                id: 'plan_business',
                code: 'business',
                name: 'Plano Business',
                description: '100 créditos mensais com todos os 8 tipos de fotos e 90 dias de histórico.',
                monthly_credits: 100,
                price_cents: 15990,
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
                      features={(() => {
                        if (plan.code === 'pessoal') {
                          return [
                            '15 créditos renovados todo mês',
                            'Fotos pessoais, retratos e restauração',
                            'Retenção garantida de 45 dias',
                            'Downloads em alta resolução (PNG, JPG, WebP)',
                            'Cancele quando quiser com 1 clique',
                          ];
                        }
                        if (plan.code === 'pro') {
                          return [
                            '40 créditos renovados todo mês',
                            'Exclusivo: Imagem Motion & Efeitos Visuais ✨',
                            'Retenção estendida de 60 dias',
                            'Sem fotografia Comercial & E-commerce',
                            'Cancele quando quiser com 1 clique',
                          ];
                        }
                        return [
                          '100 créditos renovados todo mês',
                          'Acesso total aos 8 tipos de fotos',
                          'Comercial & E-commerce + Imagem Motion',
                          'Retenção máxima de 90 dias',
                          'Prioridade máxima na fila de renderização',
                        ];
                      })()}
                      buttonText={isAuthenticated ? 'Assinar no Painel' : `Assinar ${plan.name}`}
                      onSelect={() => {
                        const target = `/pricing?tab=plans&item=${encodeURIComponent(plan.code)}`;
                        if (isAuthenticated) {
                          navigate(target);
                        } else {
                          navigate(`/auth/login?redirect=${encodeURIComponent(target)}`);
                        }
                      }}
                    />
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* Seção 6: FAQ */}
      <section className="py-14 md:py-20 border-b border-border/60 bg-card/20 w-full max-w-full overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6 md:space-y-8">
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

      {/* Seção Exclusiva de Instalação Mobile & Desktop (PWA Apple & Android) */}
      <section className="py-12 md:py-24 border-b border-border/80 bg-gradient-to-b from-card/30 to-background w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-primary/30 bg-card/60 backdrop-blur-xl p-5 sm:p-8 md:p-12 overflow-hidden shadow-2xl">
            {/* Efeito de brilho de fundo (Otimizado para mobile: desativado em telas pequenas para fluidez a 60fps) */}
            <div className="hidden sm:block absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="hidden sm:block absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>Aplicativo Oficial para Celular e Computador</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Instale o Photo Studio AI no seu{' '}
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    iPhone (Apple) ou Android
                  </span>
                </h2>

                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Acesse com 1 toque direto da tela inicial do seu celular, sem precisar baixar nada pesado da App Store ou Play Store. Funciona em tela cheia com alta velocidade, câmera integrada e suporte offline.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2.5 text-xs text-foreground/90 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Compatível com iOS (Safari / iPhone / iPad)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-foreground/90 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Compatível com Android (Chrome / Samsung)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-foreground/90 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero espaço de armazenamento ocupado</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-foreground/90 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Câmera instantânea e edição por voz</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setInstallModalOpen(true)}
                    leftIcon={<Smartphone className="w-5 h-5" />}
                    className="w-full sm:w-auto shadow-lg shadow-primary/20"
                  >
                    Instalar Aplicativo Agora
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate('/auth/register')}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                  >
                    Criar Conta Gratuita
                  </Button>
                </div>
              </div>

              {/* Card ilustrativo das plataformas */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm p-6 rounded-2xl bg-secondary/60 border border-border/80 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-500" />
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">PWA Standalone</span>
                  </div>

                  <div className="flex items-center justify-around py-4">
                    <div
                      onClick={() => setInstallModalOpen(true)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/80 hover:border-primary/60 transition-all cursor-pointer w-28 text-center"
                    >
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <Apple className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-foreground">Apple iOS</span>
                      <span className="text-[10px] text-muted-foreground">iPhone & iPad</span>
                    </div>

                    <div
                      onClick={() => setInstallModalOpen(true)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/80 hover:border-emerald-500/60 transition-all cursor-pointer w-28 text-center"
                    >
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <Chrome className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-foreground">Android</span>
                      <span className="text-[10px] text-muted-foreground">Google & Samsung</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
                    <span className="text-xs font-semibold text-primary">
                      Instalação direta pelo navegador em 5 segundos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/80 bg-card/60 py-8 md:py-12 text-xs text-muted-foreground w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo size="sm" />
            <span className="text-[11px]">
              Photo Studio AI — Todos os direitos reservados.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-6 font-medium text-center">
            <a href="/auth/register" className="hover:text-foreground transition-colors py-1">
              Criar Conta
            </a>
            <a href="/auth/login" className="hover:text-foreground transition-colors py-1">
              Acessar Studio
            </a>
            <button
              type="button"
              onClick={() => { setLegalModalTab('terms'); setLegalModalOpen(true); }}
              className="hover:text-foreground transition-colors py-1"
            >
              Termos de Uso
            </button>
            <button
              type="button"
              onClick={() => { setLegalModalTab('privacy'); setLegalModalOpen(true); }}
              className="hover:text-foreground transition-colors py-1"
            >
              Privacidade LGPD
            </button>
            <a href="#precos" className="hover:text-foreground transition-colors py-1">
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

      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />
    </div>
  );
};
