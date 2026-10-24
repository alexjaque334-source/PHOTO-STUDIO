import React, { useState } from 'react';
import {
  PageHeader,
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Alert,
  Modal,
  Drawer,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Progress,
  EmptyState,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  StatCard,
  PriceCard,
  Dropzone,
  BeforeAfterSlider,
  useToast,
  Logo,
} from '@/design-system';
import {
  Sparkles,
  Wand2,
  Eye,
  Camera,
  Layers,
  Coins,
  History,
  Download,
  Trash2,
  MoreVertical,
  Palette,
  CheckCircle,
} from 'lucide-react';

export const DesignSystemPage: React.FC = () => {
  const { success, error, info, warning } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [progressVal, setProgressVal] = useState(68);
  const [switchActive, setSwitchActive] = useState(true);
  const [checkboxActive, setCheckboxActive] = useState(true);
  const [selectedTier, setSelectedTier] = useState<'economico' | 'padrao' | 'premium'>('padrao');
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  const sampleOriginal =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80';
  const sampleEnhanced =
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80';

  const handleFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewFile(url);
    success(`Arquivo "${file.name}" carregado com sucesso!`, 'Upload concluído');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="ALEGON Design System & Component Studio"
        description="Catálogo canônico e interativo de componentes sofisticados e acessíveis (WCAG 2.2 AA) da ALEGON Marketing & Tecnologia."
        badge={
          <Badge variant="gold" size="md">
            v1.0 Canônico
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Eye className="h-4 w-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Abrir Modal
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="h-4 w-4" />}
              onClick={() => setIsDrawerOpen(true)}
            >
              Abrir Drawer
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabList aria-label="Seções do catálogo de componentes">
          <TabTrigger value="overview" icon={<Layers className="h-4 w-4" />}>
            Visão Geral & Métricas
          </TabTrigger>
          <TabTrigger value="editor" icon={<Wand2 className="h-4 w-4" />}>
            Componentes do Studio
          </TabTrigger>
          <TabTrigger value="forms" icon={<Palette className="h-4 w-4" />}>
            Formulários & Entradas
          </TabTrigger>
          <TabTrigger value="pricing" icon={<Coins className="h-4 w-4" />}>
            Planos & Carteira
          </TabTrigger>
          <TabTrigger value="feedback" icon={<CheckCircle className="h-4 w-4" />}>
            Feedback & Alertas
          </TabTrigger>
        </TabList>

        <TabContent value="overview" className="space-y-8">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Cartões de Estatísticas (Dashboard / Admin)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Saldo de Créditos"
                value="128"
                variant="gold"
                icon={<Coins className="h-5 w-5" />}
                description="8 créditos expiram em 5 dias"
              />
              <StatCard
                title="Fotos Ativas"
                value="42"
                icon={<Camera className="h-5 w-5" />}
                trend={{ value: 14, isPositive: true, label: 'vs. mês passado' }}
              />
              <StatCard
                title="Edições Realizadas"
                value="210"
                icon={<Sparkles className="h-5 w-5" />}
                trend={{ value: 28, isPositive: true, label: 'este ciclo' }}
              />
              <StatCard
                title="Retenção Média"
                value="64 dias"
                icon={<History className="h-5 w-5" />}
                description="Prazo legal seguro de 90 dias"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Identidade Visual & Marcas da Empresa</CardTitle>
              <CardDescription>
                Renderização pura em SVG escalável do ALEGON AI Photo Studio.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-8 py-4">
              <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center gap-2">
                <Logo size="lg" />
                <span className="text-[11px] text-muted-foreground font-mono">Full Logo (Grande)</span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center gap-2">
                <Logo size="md" />
                <span className="text-[11px] text-muted-foreground font-mono">Full Logo (Padrão)</span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center gap-2">
                <Logo variant="mark" size="md" />
                <span className="text-[11px] text-muted-foreground font-mono">Mark Ícone</span>
              </div>
            </CardContent>
          </Card>
        </TabContent>

        <TabContent value="editor" className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Slider Interativo Antes / Depois
              </h2>
              <Badge variant="secondary">Acessível WCAG 2.2</Badge>
            </div>
            <div className="max-w-4xl mx-auto aspect-[16/10] rounded-2xl overflow-hidden border border-border">
              <BeforeAfterSlider
                beforeImage={sampleOriginal}
                afterImage={sampleEnhanced}
                beforeLabel="Foto Original"
                afterLabel="Restauração & Cores IA"
                initialPosition={50}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Dropzone com Drag & Drop
            </h2>
            <Dropzone
              onFileSelect={handleFileUpload}
              currentPreviewUrl={previewFile}
              onClearPreview={() => setPreviewFile(null)}
            />
          </div>
        </TabContent>

        <TabContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Controles e Formulários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Exemplo de Input" placeholder="Digite algo..." />
              <Textarea label="Exemplo de Textarea" placeholder="Digite seu prompt..." showCharCount maxCharacters={2000} />
              <div className="flex items-center gap-4">
                <Checkbox label="Checkbox Ativo" checked={checkboxActive} onChange={(e) => setCheckboxActive(e.target.checked)} />
                <Switch label="Switch Ativo" checked={switchActive} onChange={setSwitchActive} />
              </div>
            </CardContent>
          </Card>
        </TabContent>

        <TabContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PriceCard
              name="Iniciante"
              description="Plano inicial para criadores individuais."
              priceFormatted="R$ 39"
              creditsLabel="50 Créditos / mês"
              features={['50 fotos com IA por mês', 'Retenção de 90 dias']}
              buttonText="Assinar"
            />
            <PriceCard
              name="Profissional"
              description="Ideal para fotógrafos e estúdios ativos."
              priceFormatted="R$ 89"
              creditsLabel="200 Créditos / mês"
              isPopular
              features={['200 fotos com IA por mês', 'Retenção de 90 dias', 'Acesso prioritário']}
              buttonText="Assinar"
            />
            <PriceCard
              name="Pacote Avulso"
              description="Créditos avulsos sem cobrança recorrente."
              priceFormatted="R$ 59"
              periodLabel="pagamento único"
              creditsLabel="100 Créditos Avulsos"
              features={['100 créditos válidos por 1 ano', 'Sem mensalidade']}
              buttonText="Comprar"
            />
          </div>
        </TabContent>

        <TabContent value="feedback" className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => success('Operação concluída com sucesso!')}>
              Toast Sucesso
            </Button>
            <Button variant="secondary" size="sm" onClick={() => error('Ocorreu um erro na solicitação.')}>
              Toast Erro
            </Button>
            <Button variant="secondary" size="sm" onClick={() => warning('Atenção aos seus créditos.')}>
              Toast Aviso
            </Button>
            <Button variant="secondary" size="sm" onClick={() => info('Seus dados estão protegidos.')}>
              Toast Info
            </Button>
          </div>

          <Alert variant="info" title="Informativo LGPD">
            Suas fotos permanecem criptografadas e restritas ao seu usuário.
          </Alert>
          <Progress value={progressVal} label="Progresso da Demonstração" showValueLabel />
        </TabContent>
      </Tabs>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal de Demonstração"
        description="Este é um exemplo de modal do Design System."
        footer={
          <Button variant="primary" onClick={() => setIsModalOpen(false)}>
            Fechar
          </Button>
        }
      >
        <p className="text-xs text-muted-foreground">
          Os modais possuem acessibilidade completa com trap de foco, suporte a tecla Escape e backdrop com blur.
        </p>
      </Modal>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Drawer Lateral"
        description="Painel deslizante acessível."
      >
        <p className="text-xs text-muted-foreground">Conteúdo exibido dentro do drawer lateral.</p>
      </Drawer>
    </div>
  );
};
