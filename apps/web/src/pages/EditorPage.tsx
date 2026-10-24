import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Button,
  IconButton,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Textarea,
  Dropzone,
  BeforeAfterSlider,
  Progress,
  Modal,
  Alert,
  Skeleton,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  useToast,
} from '@/design-system';
import {
  Sparkles,
  Scissors,
  Wand2,
  Download,
  Coins,
  History,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Camera,
  RefreshCw,
  Sliders,
  ChevronRight,
  Eye,
  FileImage,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  api,
  EditTool,
  Tier,
  ImageSummary,
  ImageVersion,
  JobSummary,
  EditQuoteResponse,
} from '@/lib/api-client';
import { generateThumbnail, convertAndDownload, ExportFormat } from '@/lib/image-utils';

interface ToolItem {
  id: EditTool;
  label: string;
  category: 'Fundo & Isolamento' | 'Qualidade & Restauração' | 'Comercial & Criativo';
  description: string;
  defaultPrompt: string;
  suggestions: string[];
}

const TOOLS_CONFIG: ToolItem[] = [
  // Categoria A: Fundo & Isolamento
  {
    id: 'remove_background',
    label: 'Remover Fundo',
    category: 'Fundo & Isolamento',
    description: 'Recorte automático do assunto principal com bordas precisas.',
    defaultPrompt: 'Remover o fundo da imagem mantendo o assunto perfeitamente isolado.',
    suggestions: ['Isolar apenas a pessoa', 'Recortar produto com máscara suave', 'Manter cabelos naturais'],
  },
  {
    id: 'transparent_background',
    label: 'Fundo Transparente',
    category: 'Fundo & Isolamento',
    description: 'Gera canal alfa transparente puro sem serrilhado.',
    defaultPrompt: 'Exportar imagem com fundo transparente em canal alfa puro.',
    suggestions: ['Fundo PNG 100% transparente', 'Suavizar bordas com antialiasing'],
  },
  {
    id: 'replace_background',
    label: 'Substituir Fundo',
    category: 'Fundo & Isolamento',
    description: 'Substitui o fundo atual por um cenário personalizado.',
    defaultPrompt: 'Substituir o fundo por um estúdio fotográfico minimalista em tons neutros de cinza com iluminação suave.',
    suggestions: ['Fundo de estúdio executivo', 'Praia paradisíaca ao entardecer', 'Ambiente de loft urbano moderno'],
  },
  {
    id: 'remove_people',
    label: 'Remover Pessoas',
    category: 'Fundo & Isolamento',
    description: 'Elimina pedestres e pessoas indesejadas do fundo.',
    defaultPrompt: 'Remover todas as pessoas e pedestres ao fundo mantendo o ambiente limpo.',
    suggestions: ['Remover figurantes ao fundo', 'Manter apenas a pessoa central', 'Preencher espaço com o cenário natural'],
  },
  {
    id: 'remove_objects',
    label: 'Remover Objetos',
    category: 'Fundo & Isolamento',
    description: 'Inpainting inteligente de fios, placas, sombras ou manchas.',
    defaultPrompt: 'Remover objetos estranhos, fios de postes e elementos de distração da cena.',
    suggestions: ['Remover postes e fios elétricos', 'Apagar manchas e reflexos indesejados', 'Remover placa de trânsito'],
  },

  // Categoria B: Qualidade & Restauração
  {
    id: 'improve_lighting',
    label: 'Melhorar Iluminação',
    category: 'Qualidade & Restauração',
    description: 'Equilíbrio profissional de sombras e luz tridimensional.',
    defaultPrompt: 'Corrigir a iluminação com luz de estúdio suave, realçando volume facial e eliminando sombras duras.',
    suggestions: ['Iluminação suave estilo softbox', 'Realce de luz de contorno dourada', 'Eliminar superexposição'],
  },
  {
    id: 'improve_colors',
    label: 'Aprimorar Cores',
    category: 'Qualidade & Restauração',
    description: 'Gradação cinematográfica e correção de balanço de branco.',
    defaultPrompt: 'Realçar a saturação natural e corrigir o balanço de branco para tons quentes e vívidos de estúdio.',
    suggestions: ['Tons quentes de pôr do sol', 'Gradação cinematográfica neutra', 'Balanço de branco preciso'],
  },
  {
    id: 'sharpen',
    label: 'Nitidez & Clareza',
    category: 'Qualidade & Restauração',
    description: 'Aprimora micro-detalhes, olhos, texturas e foco.',
    defaultPrompt: 'Aumentar a nitidez óptica, revelando texturas finas e clareza nos olhos sem gerar ruído.',
    suggestions: ['Nitidez ultra-alta nos olhos', 'Realce de textura de tecido', 'Correção de leve desfoque'],
  },
  {
    id: 'restore_photo',
    label: 'Restaurar Foto Antiga',
    category: 'Qualidade & Restauração',
    description: 'Recupera arranhões, manchas e desbotamento de fotos antigas.',
    defaultPrompt: 'Restaurar foto antiga danificada, removendo vincos, arranhões e restaurando o contraste original.',
    suggestions: ['Remover rachaduras e vincos', 'Colorir foto em preto e branco', 'Recuperar foto desbotada'],
  },

  // Categoria C: Comercial & Criativo
  {
    id: 'product_photo',
    label: 'Foto de Produto (E-commerce)',
    category: 'Comercial & Criativo',
    description: 'Posiciona o produto sobre pedestal com iluminação comercial.',
    defaultPrompt: 'Apresentar o produto em um pedestal cilíndrico minimalista com iluminação de estúdio comercial e reflexos elegantes.',
    suggestions: ['Pedestal de mármore minimalista', 'Fundo de estúdio branco e-commerce', 'Cenário botânico com folhas sutis'],
  },
  {
    id: 'add_elements',
    label: 'Adicionar Elementos',
    category: 'Comercial & Criativo',
    description: 'Insere elementos ou efeitos visuais coerentes com a cena.',
    defaultPrompt: 'Adicionar raios solares sutis (god rays) e partículas leves de poeira dourada flutuando.',
    suggestions: ['Partículas de luz dourada', 'Flores delicadas em primeiro plano', 'Gotas de orvalho realistas'],
  },
  {
    id: 'replace_elements',
    label: 'Substituir Elementos',
    category: 'Comercial & Criativo',
    description: 'Substitui roupas, tecidos, texturas ou materiais.',
    defaultPrompt: 'Substituir a roupa por um terno executivo moderno de alta costura em azul marinho.',
    suggestions: ['Trocar roupa por terno azul marinho', 'Substituir fundo por estúdio de madeira', 'Alterar cor para preto fosco'],
  },
  {
    id: 'variations',
    label: 'Variações Criativas',
    category: 'Comercial & Criativo',
    description: 'Gera composições e ângulos alternativos mantendo o sujeito.',
    defaultPrompt: 'Criar uma variação criativa do ângulo com iluminação dramática mantendo todos os traços do produto.',
    suggestions: ['Ângulo levemente inclinado', 'Iluminação dramática chiaroscuro', 'Enquadramento fechado macro'],
  },
  {
    id: 'free_prompt',
    label: 'Prompt Livre com IA',
    category: 'Comercial & Criativo',
    description: 'Instrução em linguagem natural sem filtros pré-fixados.',
    defaultPrompt: 'Descreva livremente o que deseja alterar ou adicionar na foto...',
    suggestions: ['Transformar em pintura a óleo clássica', 'Estilo editorial de revista de moda', 'Cores no estilo Polaroid vintage'],
  },
];

export const EditorPage: React.FC = () => {
  const { imageId } = useParams<{ imageId?: string }>();
  const navigate = useNavigate();
  const { walletBalance, refreshWallet } = useAuth();
  const { success, error, info } = useToast();

  // Estados principais da Imagem e Versões
  const [image, setImage] = useState<ImageSummary | null>(null);
  const [versions, setVersions] = useState<ImageVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [activeVersionUrl, setActiveVersionUrl] = useState<string | null>(null);
  const [originalVersionUrl, setOriginalVersionUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Estados de Configuração da Edição
  const [selectedTool, setSelectedTool] = useState<EditTool>('remove_background');
  const [promptText, setPromptText] = useState<string>(TOOLS_CONFIG[0].defaultPrompt);
  const [selectedTier, setSelectedTier] = useState<Tier>('padrao');

  // Estados de Cotação e Execução de Job
  const [quoteData, setQuoteData] = useState<EditQuoteResponse | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Iniciando processamento...');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Estados de Upload caso não haja imagem carregada
  const [isUploading, setIsUploading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Carregar dados da imagem quando imageId estiver presente
  const loadImageData = async (id: string, selectVersionId?: string) => {
    setIsLoadingImage(true);
    try {
      const data = await api.images.get(id);
      setImage(data.image);
      setVersions(data.versions);

      const targetVersionId =
        selectVersionId || data.image.currentVersionId || data.versions[0]?.id;
      setActiveVersionId(targetVersionId);

      // Obter URLs assinadas para a versão ativa e a original (v1)
      const v1 = data.versions.find((v) => v.versionNumber === 1) || data.versions[0];
      if (v1) {
        const v1UrlRes = await api.images.getVersionUrl(id, v1.id);
        setOriginalVersionUrl(v1UrlRes.url);
      }

      const activeUrlRes = await api.images.getVersionUrl(id, targetVersionId);
      setActiveVersionUrl(activeUrlRes.url);
    } catch (err: any) {
      error(err.message || 'Falha ao carregar a imagem do estúdio.', 'Erro');
    } finally {
      setIsLoadingImage(false);
    }
  };

  useEffect(() => {
    if (imageId) {
      loadImageData(imageId);
    } else {
      setImage(null);
      setVersions([]);
      setActiveVersionId(null);
      setActiveVersionUrl(null);
      setOriginalVersionUrl(null);
    }
  }, [imageId]);

  // Troca de versão ativa selecionada
  const handleSelectVersion = async (version: ImageVersion) => {
    if (!image) return;
    setActiveVersionId(version.id);
    try {
      const res = await api.images.getVersionUrl(image.id, version.id);
      setActiveVersionUrl(res.url);
    } catch (err: any) {
      error(err.message || 'Não foi possível carregar esta versão.', 'Erro');
    }
  };

  // Troca de ferramenta (com preservação inteligente de prompt se o usuário já editou)
  const handleSelectTool = (toolId: EditTool) => {
    const config = TOOLS_CONFIG.find((t) => t.id === toolId);
    if (!config) return;
    setSelectedTool(toolId);
    // Se o prompt atual for igual ao default de outra ferramenta, atualiza para o default desta
    const isCurrentDefault = TOOLS_CONFIG.some((t) => t.defaultPrompt === promptText);
    if (isCurrentDefault || !promptText.trim()) {
      setPromptText(config.defaultPrompt);
    }
  };

  // 2. Upload de nova imagem
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      let thumbBlob: Blob | undefined;
      try {
        thumbBlob = await generateThumbnail(file);
      } catch (tErr) {
        console.warn('Miniatura falhou, prosseguindo com imagem original:', tErr);
      }

      const res = await api.images.upload(file, thumbBlob);
      success(`Foto "${file.name}" carregada no estúdio!`, 'Upload Concluído');
      navigate(`/studio/${res.image.id}`);
    } catch (err: any) {
      error(err.message || 'Falha no upload da foto.', 'Erro de Upload');
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Solicitar Cotação de Créditos
  const handleRequestQuote = async () => {
    if (!image || !activeVersionId) return;

    if (!promptText.trim()) {
      error('Por favor, insira uma instrução ou selecione uma ferramenta.', 'Prompt Vazio');
      return;
    }

    setIsQuoting(true);
    try {
      const quote = await api.edits.quote({
        imageId: image.id,
        versionId: activeVersionId,
        prompt: promptText.trim(),
        tool: selectedTool,
        tier: selectedTier,
      });
      setQuoteData(quote);
      setIsConfirmModalOpen(true);
    } catch (err: any) {
      error(err.message || 'Falha ao orçar a edição de créditos.', 'Erro na Cotação');
    } finally {
      setIsQuoting(false);
    }
  };

  // 4. Confirmar e Iniciar Execução do Job
  const handleConfirmEdit = async () => {
    if (!quoteData || !image) return;

    setIsConfirmModalOpen(false);
    setIsProcessing(true);
    setProgressPercent(15);
    setStatusMessage('Reservando créditos e enfileirando job...');

    abortControllerRef.current = new AbortController();

    try {
      const confirmRes = await api.edits.confirm(quoteData.editRequestId);
      setActiveJobId(confirmRes.jobId);
      setProgressPercent(35);
      setStatusMessage('Enviando ao pipeline de inteligência artificial...');

      // Inicia polling com backoff
      const finishedJob = await api.edits.pollJob(
        confirmRes.jobId,
        (currentJob, attempt) => {
          if (attempt === 1) {
            setProgressPercent(50);
            setStatusMessage('Aprimorando pixels e renderizando detalhes...');
          } else if (attempt === 2) {
            setProgressPercent(75);
            setStatusMessage('Aplicando correções de fidelidade e iluminação...');
          } else {
            setProgressPercent(90);
            setStatusMessage('Finalizando nova versão e salvando no R2...');
          }
        },
        abortControllerRef.current.signal
      );

      if (finishedJob.status === 'completed') {
        setProgressPercent(100);
        setStatusMessage('Edição concluída com sucesso!');
        success('Nova versão gerada com sucesso!', 'Edição Concluída');
        await refreshWallet();
        // Recarrega imagem selecionando a nova versão
        await loadImageData(image.id, finishedJob.resultVersionId);
      } else {
        throw new Error(finishedJob.errorMessage || 'Falha técnica no processamento do modelo.');
      }
    } catch (err: any) {
      error(
        err.message || 'Ocorreu uma falha no processamento. Seus créditos foram liberados.',
        'Falha no Job'
      );
      await refreshWallet();
    } finally {
      setIsProcessing(false);
      setActiveJobId(null);
    }
  };

  // Download nos 3 formatos com Canvas
  const handleDownload = async (format: ExportFormat) => {
    if (!activeVersionUrl || !image) return;
    setIsDownloading(true);
    try {
      const filename = `${image.title || 'photostudio'}_v${
        versions.find((v) => v.id === activeVersionId)?.versionNumber || 'edit'
      }`;
      await convertAndDownload(activeVersionUrl, filename, format);
      success(`Download em ${format.toUpperCase()} iniciado com sucesso!`, 'Exportado');
    } catch (err: any) {
      error(err.message || 'Falha ao processar download do arquivo.', 'Erro no Download');
    } finally {
      setIsDownloading(false);
    }
  };

  const activeToolConfig = TOOLS_CONFIG.find((t) => t.id === selectedTool) || TOOLS_CONFIG[0];
  const activeVersion = versions.find((v) => v.id === activeVersionId);
  const isOriginal = activeVersion?.versionNumber === 1;

  // SE NÃO HÁ IMAGEM CARREGADA: EXIBE TELA DE NOVO UPLOAD NO STUDIO
  if (!imageId || !image) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <PageHeader
          title="Photo Studio AI — Estúdio de Edição"
          description="Envie sua foto para aplicar as 14 ferramentas profissionais de inteligência artificial generativa."
          badge={<Badge variant="gold">Cockpit Pro</Badge>}
        />

        <Card className="border-border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Carregar Imagem para o Estúdio
            </CardTitle>
            <CardDescription>
              Formatos aceitos: JPG, PNG ou WebP de alta resolução (até 15MB e 40 megapixels).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Dropzone
              onFileSelect={handleFileUpload}
              disabled={isUploading}
            />
            {isUploading && (
              <div className="text-center py-4 space-y-2">
                <Progress value={70} label="Enviando para o R2 seguro..." />
                <p className="text-xs text-muted-foreground animate-pulse">
                  Criando miniatura otimizada no navegador e despachando arquivo...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Bar do Estúdio */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/library')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Biblioteca
          </Button>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              {image.title}
            </h1>
            <span className="text-[11px] text-muted-foreground">
              Versão ativa: <strong>v{activeVersion?.versionNumber || 1}</strong> ({activeVersion?.width}x{activeVersion?.height}px)
            </span>
          </div>
        </div>

        {/* Botões de Ação: Download Multi-formato e Nova Foto */}
        <div className="flex items-center gap-2">
          <DropdownMenu
            trigger={
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                isLoading={isDownloading}
                loadingText="Convertendo..."
              >
                Exportar / Baixar
              </Button>
            }
          >
            <DropdownMenuItem onClick={() => handleDownload('png')}>
              <div className="flex flex-col">
                <span className="font-semibold text-xs">PNG de Alta Fidelidade</span>
                <span className="text-[10px] text-muted-foreground">Ideal para fundos transparentes</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('jpg')}>
              <div className="flex flex-col">
                <span className="font-semibold text-xs">JPG Otimizado</span>
                <span className="text-[10px] text-muted-foreground">Recomendado para web e e-commerce</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('webp')}>
              <div className="flex flex-col">
                <span className="font-semibold text-xs">WebP Moderno</span>
                <span className="text-[10px] text-muted-foreground">Máxima compressão sem perda visível</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenu>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => navigate('/studio')}
          >
            Nova Foto
          </Button>
        </div>
      </div>

      {/* Cockpit Principal: Lateral de Ferramentas + Canvas Central com Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* BARRA LATERAL ESQUERDA: Ferramentas & Configuração (5 Colunas) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  Ferramentas Especializadas
                </span>
                <Badge variant="secondary" size="sm">
                  14 Motores
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Selecione o motor de IA desejado para a transformação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Abas / Categorias das Ferramentas */}
              <div className="space-y-3">
                {(['Fundo & Isolamento', 'Qualidade & Restauração', 'Comercial & Criativo'] as const).map(
                  (cat) => (
                    <div key={cat} className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {cat}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {TOOLS_CONFIG.filter((t) => t.category === cat).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectTool(t.id)}
                            className={`p-2 rounded-lg text-left text-xs font-semibold transition-all border select-none ${
                              selectedTool === t.id
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                : 'bg-secondary/40 text-foreground border-border/60 hover:bg-secondary hover:border-border'
                            }`}
                          >
                            <span className="block truncate">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Descrição da Ferramenta Ativa */}
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 text-xs space-y-1">
                <span className="font-bold text-foreground block">{activeToolConfig.label}</span>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {activeToolConfig.description}
                </p>
              </div>

              {/* Campo de Prompt em Linguagem Natural com Preservação */}
              <div className="space-y-2">
                <Textarea
                  label="Instrução Criativa (Prompt IA)"
                  placeholder="Descreva a alteração ou mantenha a instrução padrão recomendada..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  showCharCount
                  maxCharacters={2000}
                  rows={3}
                />

                {/* Sugestões Rápidas de Prompt Contextuais */}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Sugestões rápidas de refinamento:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeToolConfig.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPromptText(s)}
                        className="px-2 py-1 rounded-md bg-secondary border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seletor de Tier */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Qualidade & Nível de Detalhe</span>
                  <span className="font-mono text-[11px] text-amber-500 font-bold">
                    {selectedTier === 'premium' ? '2 Créditos' : '1 Crédito'}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTier('economico')}
                    className={`p-2 rounded-lg border text-left text-xs transition-all ${
                      selectedTier === 'economico'
                        ? 'border-primary bg-primary/10 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <span className="block font-semibold">Econômico</span>
                    <span className="text-[10px] opacity-80">1 crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('padrao')}
                    className={`p-2 rounded-lg border text-left text-xs transition-all ${
                      selectedTier === 'padrao'
                        ? 'border-primary bg-primary/10 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <span className="block font-semibold">Padrão</span>
                    <span className="text-[10px] opacity-80">1 crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('premium')}
                    className={`p-2 rounded-lg border text-left text-xs transition-all ${
                      selectedTier === 'premium'
                        ? 'border-amber-500 bg-amber-500/10 font-bold text-amber-500'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <span className="block font-semibold">Premium</span>
                    <span className="text-[10px] opacity-80">2 créditos</span>
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex flex-col gap-3">
              <Button
                variant="gold"
                fullWidth
                size="md"
                onClick={handleRequestQuote}
                isLoading={isQuoting}
                loadingText="Calculando cotação..."
                leftIcon={<Sparkles className="h-4 w-4" />}
                disabled={isProcessing}
              >
                Orçar e Executar Edição
              </Button>
              <div className="flex items-center justify-between w-full text-[11px] text-muted-foreground">
                <span>Saldo na carteira:</span>
                <span className="font-mono font-bold text-foreground">
                  {walletBalance?.available ?? 0} créditos
                </span>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* CANVAS CENTRAL E HISTÓRICO DE VERSÕES (7 Colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visualizador Antes e Depois */}
          <Card className="border-border overflow-hidden">
            <CardHeader className="py-3 px-4 bg-secondary/40 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Sliders className="h-4 w-4 text-primary" />
                Comparador Visual Antes / Depois
              </div>
              <Badge variant={isOriginal ? 'secondary' : 'success'} size="sm">
                {isOriginal ? 'Versão Original (v1)' : `Versão Derivada (v${activeVersion?.versionNumber})`}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-[4/3] sm:aspect-[16/10] w-full bg-black/90 flex items-center justify-center overflow-hidden">
                {activeVersionUrl ? (
                  originalVersionUrl && originalVersionUrl !== activeVersionUrl ? (
                    <BeforeAfterSlider
                      beforeImage={originalVersionUrl}
                      afterImage={activeVersionUrl}
                      beforeLabel="Foto Original (v1)"
                      afterLabel={`Versão v${activeVersion?.versionNumber} IA`}
                      initialPosition={50}
                    />
                  ) : (
                    <img
                      src={activeVersionUrl}
                      alt={image.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  )
                ) : (
                  <Skeleton className="h-full w-full" />
                )}
              </div>
            </CardContent>
            {activeVersion?.promptSummary && (
              <div className="p-3 bg-secondary/30 border-t border-border text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Prompt utilizado nesta versão: </span>
                <span>{activeVersion.promptSummary}</span>
              </div>
            )}
          </Card>

          {/* Barra de Progresso Durante Processamento */}
          {isProcessing && (
            <Card className="border-primary/50 bg-primary/5 p-4 space-y-3">
              <Progress value={progressPercent} label={statusMessage} showValueLabel />
              <p className="text-xs text-muted-foreground text-center">
                Aguarde alguns segundos enquanto a IA gera a nova imagem com precisão óptica.
              </p>
            </Card>
          )}

          {/* Linha do Tempo de Versões (Não Destrutivo) */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Histórico de Versões Não-Destrutivo
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  {versions.length} {versions.length === 1 ? 'versão salva' : 'versões salvas'}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                A foto original (v1) nunca é sobrescrita. Clique em qualquer versão para torná-la a base de novas alterações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {versions.map((ver) => {
                  const isSelected = ver.id === activeVersionId;
                  return (
                    <div
                      key={ver.id}
                      onClick={() => handleSelectVersion(ver)}
                      className={`shrink-0 w-28 rounded-xl border p-2 cursor-pointer transition-all select-none ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 bg-primary/5'
                          : 'border-border bg-card hover:bg-secondary/60'
                      }`}
                    >
                      <div className="aspect-square bg-secondary rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        {ver.url ? (
                          <img
                            src={ver.url}
                            alt={`v${ver.versionNumber}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileImage className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-0.5 text-center">
                        <span className="font-bold text-xs text-foreground block">
                          {ver.versionNumber === 1 ? 'v1 (Original)' : `v${ver.versionNumber}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {ver.promptSummary || 'Upload base'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Confirmação & Cotação de Créditos */}
      {quoteData && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Confirmar Execução de Edição de Imagem"
          description="Revise a cotação de créditos e o tier selecionado antes de iniciar a renderização."
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="gold"
                onClick={handleConfirmEdit}
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                Confirmar ({quoteData.credits} {quoteData.credits === 1 ? 'Crédito' : 'Créditos'})
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/60 border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ferramenta Selecionada:</span>
              <span className="font-semibold text-foreground">{activeToolConfig.label}</span>
            </div>

            <div className="p-3 rounded-lg bg-secondary/60 border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tier Escolhido:</span>
              <span className="font-semibold text-foreground capitalize">
                {quoteData.tier} ({quoteData.modelLabel})
              </span>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
              <span className="text-amber-600 dark:text-amber-400 font-medium">Custo desta Edição:</span>
              <span className="font-mono font-bold text-amber-500">
                {quoteData.credits} {quoteData.credits === 1 ? 'crédito' : 'créditos'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-secondary/40 border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Saldo Disponível:</span>
              <span className="font-mono font-semibold text-foreground">
                {quoteData.balance.available} créditos
              </span>
            </div>

            {quoteData.balance.available < quoteData.credits && (
              <Alert variant="danger">
                Saldo insuficiente na sua carteira. Recarregue seus créditos para prosseguir.
              </Alert>
            )}

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Garantia Photo Studio AI: Em caso de qualquer instabilidade técnica do modelo de IA ou falha de conexão, a reserva de créditos é estornada integralmente para o seu saldo.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
