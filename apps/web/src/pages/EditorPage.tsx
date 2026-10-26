import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  PageHeader,
  Button,
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
  useToast,
} from '@/design-system';
import {
  Sparkles,
  Download,
  Coins,
  History,
  ArrowLeft,
  CheckCircle2,
  Camera,
  RotateCcw,
  Sliders,
  FileImage,
  Upload,
  Star,
  Wand2,
  Mic,
  MicOff,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  api,
  ImageSummary,
  ImageVersion,
  JobSummary,
  EditQuoteResponse,
} from '@/lib/api-client';
import { generateThumbnail, convertAndDownload, ExportFormat } from '@/lib/image-utils';

// Frases de inspiração populares em linguagem natural (Português Brasileiro)
const INSPIRATION_CHIPS = [
  { label: '✨ Retrato profissional de estúdio', prompt: 'Transforme num retrato de estúdio com iluminação suave e acabamento editorial' },
  { label: '🔥 Corpo com chamas de cinema', prompt: 'Meu corpo pegando fogo com chamas reais e iluminação de cinema' },
  { label: '👔 Ensaio executivo pro LinkedIn', prompt: 'Deixa minha foto com cara de estúdio profissional executivo para o LinkedIn' },
  { label: '🎂 Aniversário com balões e confetes', prompt: 'Cenário de festa de aniversário com balões dourados, bolo e confetes' },
  { label: '🏖️ Praia paradisíaca no pôr do sol', prompt: 'Muda o fundo para uma praia paradisíaca no pôr do sol dourado' },
  { label: '👰 Ensaio de casamento romântico', prompt: 'Transforme num ensaio romântico de casamento com flores e iluminação suave' },
  { label: '👥 Tirar pessoas do fundo', prompt: 'Remove todas as pessoas e pedestres indesejados que estão atrás de mim' },
  { label: '📦 Foto profissional de produto', prompt: 'Apresenta este produto num pedestal minimalista com luz de catálogo comercial' },
  { label: '💎 Nitidez ultra alta e pele perfeita', prompt: 'Aumenta a nitidez nos olhos e remove imperfeições da pele naturalmente' },
  { label: '🏎️ Ensaio de piloto de corrida', prompt: 'Me coloca como piloto de Fórmula 1 no grid de largada' },
];

export const EditorPage: React.FC = () => {
  const { imageId } = useParams<{ imageId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { walletBalance, refreshWallet } = useAuth();
  const { success, error, info } = useToast();

  // Estados principais da Imagem e Versões
  const [image, setImage] = useState<ImageSummary | null>(null);
  const [versions, setVersions] = useState<ImageVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [activeVersionUrl, setActiveVersionUrl] = useState<string | null>(null);
  const [originalVersionUrl, setOriginalVersionUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Entrada em Linguagem Natural do Usuário (REGRA ABSOLUTA: sem seleção de comandos técnicos)
  const [naturalPrompt, setNaturalPrompt] = useState<string>('');
  const [liveInterpretation, setLiveInterpretation] = useState<{
    summary: string;
    detectedCommands: string[];
    suggestedCredits: number;
    priceInCents: number;
  } | null>(null);

  // Estados de Áudio e Sugestões Inteligentes
  const [isListening, setIsListening] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Estados de Cotação e Execução de Job
  const [quoteData, setQuoteData] = useState<EditQuoteResponse | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Iniciando processamento...');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Estados de Feedback
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackCategory, setFeedbackCategory] = useState<'qualidade_ia' | 'velocidade' | 'sugestao' | 'geral' | 'bug'>('qualidade_ia');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);

  // Upload no caso de tela inicial sem imagem
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Preencher prompt vindo da câmera rápida do Dashboard (via URL query ?prompt=...)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const initialPrompt = searchParams.get('prompt');
    if (initialPrompt && !naturalPrompt) {
      setNaturalPrompt(decodeURIComponent(initialPrompt));
    }
  }, [location.search]);

  // Carregar dados da imagem
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
      error(err.message || 'Falha ao carregar a imagem.', 'Erro');
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

  // Interpretação em tempo real da linguagem natural enquanto o usuário digita ou fala
  useEffect(() => {
    if (!naturalPrompt.trim() || naturalPrompt.trim().length < 4) {
      setLiveInterpretation(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.edits.interpret(naturalPrompt.trim());
        setLiveInterpretation({
          summary: res.interpretation.humanFriendlySummary,
          detectedCommands: res.interpretation.allDetectedCommands,
          suggestedCredits: res.interpretation.suggestedCredits,
          priceInCents: res.interpretation.priceInCents,
        });
      } catch {
        // Silencioso em caso de erro de rede no debounce
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [naturalPrompt]);

  // Troca de versão ativa selecionada (Histórico Não-Destrutivo)
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

  // Upload de nova imagem
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      let thumbBlob: Blob | undefined;
      try {
        thumbBlob = await generateThumbnail(file);
      } catch (tErr) {
        console.warn('Miniatura falhou, prosseguindo:', tErr);
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

  // Reconhecimento de Voz (Microfone estilo WhatsApp)
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      info(
        'Reconhecimento de voz não suportado neste navegador. Você pode digitar sua ideia!',
        'Aviso de Voz'
      );
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      speechRecognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setNaturalPrompt(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Erro de áudio:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Falha ao iniciar microfone:', err);
      setIsListening(false);
    }
  };

  // Solicitar Cotação
  const handleRequestQuote = async () => {
    if (!image || !activeVersionId) return;

    if (!naturalPrompt.trim()) {
      error('Escreva ou fale o que você deseja mudar na foto.', 'Texto em branco');
      return;
    }

    setIsQuoting(true);
    try {
      const quote = await api.edits.quote({
        imageId: image.id,
        versionId: activeVersionId,
        prompt: naturalPrompt.trim(),
      });
      setQuoteData(quote);
      setIsConfirmModalOpen(true);
    } catch (err: any) {
      error(err.message || 'Falha ao orçar a edição.', 'Erro na Cotação');
    } finally {
      setIsQuoting(false);
    }
  };

  // Confirmar e Executar Edição com IA
  const handleConfirmEdit = async () => {
    if (!quoteData || !image) return;

    setIsConfirmModalOpen(false);
    setIsProcessing(true);
    setProgressPercent(15);
    setStatusMessage('Compreendendo sua ideia e preparando a IA...');

    abortControllerRef.current = new AbortController();

    try {
      const confirmRes = await api.edits.confirm(quoteData.editRequestId);
      setActiveJobId(confirmRes.jobId);
      setProgressPercent(35);
      setStatusMessage('Transformando a fotografia com máxima resolução...');

      // Polling do job
      const finishedJob = await api.edits.pollJob(
        confirmRes.jobId,
        (currentJob, attempt) => {
          if (attempt === 1) {
            setProgressPercent(55);
            setStatusMessage('Aplicando efeitos visuais e iluminação de estúdio...');
          } else if (attempt === 2) {
            setProgressPercent(80);
            setStatusMessage('Preservando traços faciais e refinando bordas...');
          } else {
            setProgressPercent(95);
            setStatusMessage('Salvando nova versão em alta definição...');
          }
        },
        abortControllerRef.current.signal
      );

      if (finishedJob.status === 'completed' || (finishedJob.status as string) === 'succeeded') {
        setProgressPercent(100);
        setStatusMessage('Foto transformada com sucesso!');
        success('Sua foto editada está pronta!', 'Transformação Concluída ✨');
        await refreshWallet();
        // Recarrega selecionando a nova versão
        await loadImageData(image.id, finishedJob.resultVersionId);
        // Limpa o prompt para a próxima ideia
        setNaturalPrompt('');
        setLiveInterpretation(null);
      } else {
        throw new Error(finishedJob.errorMessage || 'Falha no processamento da imagem.');
      }
    } catch (err: any) {
      error(
        err.message || 'Houve uma falha momentânea. Seus créditos não foram descontados.',
        'Falha no Processamento'
      );
      await refreshWallet();
    } finally {
      setIsProcessing(false);
      setActiveJobId(null);
    }
  };

  // Download nos 3 formatos
  const handleDownload = async (format: ExportFormat) => {
    if (!activeVersionUrl || !image) return;
    setIsDownloading(true);
    try {
      const filename = `${image.title || 'foto'}_v${
        versions.find((v) => v.id === activeVersionId)?.versionNumber || 'editada'
      }`;
      await convertAndDownload(activeVersionUrl, filename, format);
      success(`Download em ${format.toUpperCase()} iniciado!`, 'Baixado');

      if (!hasSubmittedFeedback) {
        setTimeout(() => {
          setIsFeedbackModalOpen(true);
        }, 1200);
      }
    } catch (err: any) {
      error(err.message || 'Falha ao baixar imagem.', 'Erro no Download');
    } finally {
      setIsDownloading(false);
    }
  };

  // Envio de Feedback do Assinante
  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      error('Por favor, digite seu comentário.', 'Comentário Obrigatório');
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await api.feedback.submit({
        rating: feedbackRating,
        category: feedbackCategory,
        message: feedbackMessage.trim(),
      });
      setHasSubmittedFeedback(true);
      setIsFeedbackModalOpen(false);
      setFeedbackMessage('');
      success('Obrigado! Sua avaliação foi enviada para nossa equipe.', 'Feedback Registrado ⭐');
    } catch (err: any) {
      error(err.message || 'Falha ao registrar feedback.', 'Erro');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const activeVersion = versions.find((v) => v.id === activeVersionId);
  const isOriginal = activeVersion?.versionNumber === 1;

  // Tela Inicial: Se não há imagem aberta, tela para enviar foto
  if (!imageId || !image) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <PageHeader
          title="Transforme Qualquer Foto com Inteligência Artificial"
          description="Você só precisa enviar sua foto e escrever ou falar o que quer mudar. Nossa IA cuida de todo o resto!"
          badge={<Badge variant="gold">Motor Inteligente 70 Comandos</Badge>}
        />

        <Card className="border-border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Enviar Foto para Edição
            </CardTitle>
            <CardDescription>
              Selecione uma foto da sua galeria ou computador (JPG, PNG ou WebP).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Dropzone
              onFileSelect={handleFileUpload}
              disabled={isUploading}
            />
            {isUploading && (
              <div className="text-center py-4 space-y-2">
                <Progress value={70} label="Carregando fotografia com segurança..." />
                <p className="text-xs text-muted-foreground animate-pulse">
                  Preparando sua imagem no estúdio...
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
      {/* Barra de Navegação do Estúdio */}
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
              Versão atual: <strong>v{activeVersion?.versionNumber || 1}</strong>
              {isOriginal ? ' (Foto Original)' : ' (Modificação com IA)'}
            </span>
          </div>
        </div>

        {/* Botões de Ação: Exportar e Nova Foto */}
        <div className="flex items-center gap-2">
          <DropdownMenu
            trigger={
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                isLoading={isDownloading}
                loadingText="Baixando..."
                className="h-10 text-xs font-semibold"
              >
                Baixar Foto
              </Button>
            }
          >
            <DropdownMenuItem onClick={() => handleDownload('png')}>
              <div className="flex flex-col">
                <span className="font-semibold text-xs">PNG (Máxima Fidelidade)</span>
                <span className="text-[10px] text-muted-foreground">Ideal para fundos transparentes e alta qualidade</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('jpg')}>
              <div className="flex flex-col">
                <span className="font-semibold text-xs">JPG (Padrão para Redes Sociais)</span>
                <span className="text-[10px] text-muted-foreground">Leve e perfeito para Instagram e WhatsApp</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('webp')}>
              <div className="flex flex-col">
                <span className="font-semibold text-xs">WebP (Web Moderno)</span>
                <span className="text-[10px] text-muted-foreground">Super otimizado para sites e e-commerce</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFeedbackModalOpen(true)}
            leftIcon={<Star className="h-4 w-4 text-amber-400 fill-amber-400" />}
            className="text-muted-foreground hover:text-foreground hidden sm:inline-flex h-10"
          >
            Avaliar ⭐
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Camera className="h-4 w-4" />}
            onClick={() => navigate('/dashboard')}
            className="h-10 text-xs font-semibold"
          >
            Nova Foto
          </Button>
        </div>
      </div>

      {/* Grid Principal: Entrada Natural à Esquerda + Visualizador Antes/Depois à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PAINEL ESQUERDO: Entrada em Linguagem Natural com Microfone WhatsApp (5 Colunas) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-amber-500" />
                  O que você quer mudar na foto?
                </span>
                <Badge variant="gold" size="sm">
                  IA Automática
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Fale pelo microfone ou escreva do seu jeito. Nossa inteligência artificial entende e cuida de tudo!
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Campo de Texto com Microfone Estilo WhatsApp Integrado */}
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    placeholder="Conte o que você quer mudar na foto ou toque no microfone verde para falar..."
                    value={naturalPrompt}
                    onChange={(e) => setNaturalPrompt(e.target.value)}
                    showCharCount
                    maxCharacters={2000}
                    rows={4}
                    className="text-sm font-normal pr-14"
                  />

                  {/* Botão de Microfone de Voz Estilo WhatsApp (44px) */}
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`absolute right-2.5 bottom-8 w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 ${
                      isListening
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                    title={isListening ? 'Parar gravação' : 'Falar pelo microfone'}
                  >
                    {isListening ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {isListening && (
                  <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Ouvindo sua voz... Fale o que quer mudar na foto!
                  </p>
                )}
              </div>

              {/* Botão Discreto "Me dê ideias para esta foto" */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowIdeas(!showIdeas)}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5"
                >
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  {showIdeas ? 'Ocultar ideias' : '💡 Me dê ideias para esta foto'}
                </button>

                {showIdeas && (
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-secondary/50 border border-border/60 animate-in fade-in">
                    {INSPIRATION_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNaturalPrompt(chip.prompt)}
                        className="px-2.5 py-1 rounded-full bg-background border border-border text-[11px] text-foreground/90 hover:border-amber-500/50 hover:bg-amber-500/10 transition-colors text-left"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview da Interpretação em Tempo Real */}
              {liveInterpretation && (
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Entendimento da IA:
                    </span>
                    <Badge variant="gold" size="sm">
                      {liveInterpretation.suggestedCredits} {liveInterpretation.suggestedCredits === 1 ? 'crédito' : 'créditos'}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    {liveInterpretation.summary}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                    <span>Custo estimado:</span>
                    <span className="font-semibold text-foreground">
                      {liveInterpretation.suggestedCredits} crédito ({liveInterpretation.suggestedCredits === 1 ? 'R$ 7,90' : 'R$ 15,80'})
                    </span>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-2 flex flex-col gap-3">
              <Button
                variant="gold"
                fullWidth
                size="lg"
                onClick={handleRequestQuote}
                isLoading={isQuoting}
                loadingText="Analisando solicitação..."
                leftIcon={<Sparkles className="h-5 w-5" />}
                disabled={isProcessing || !naturalPrompt.trim()}
                className="h-13 text-sm font-bold shadow-lg"
              >
                Transformar Foto com IA
              </Button>

              <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                <span>Seu saldo atual:</span>
                <span className="font-bold text-foreground font-mono">
                  {walletBalance?.available ?? 0} créditos
                </span>
              </div>
            </CardFooter>
          </Card>

          {/* Dica de Segurança e Garantia */}
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Garantia de Satisfação Total
            </span>
            <p className="leading-relaxed">
              Sua foto original nunca é perdida. Cada transformação gera uma nova versão para você comparar. Se o resultado não for o esperado, seus créditos são liberados!
            </p>
          </div>
        </div>

        {/* CANVAS CENTRAL E HISTÓRICO DE VERSÕES (7 Colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visualizador Antes e Depois */}
          <Card className="border-border overflow-hidden shadow-md">
            <CardHeader className="py-3 px-4 bg-secondary/40 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Sliders className="h-4 w-4 text-amber-500" />
                Comparador Antes e Depois
              </div>
              <Badge variant={isOriginal ? 'secondary' : 'success'} size="sm">
                {isOriginal ? 'Foto Original (v1)' : `Versão Modificada (v${activeVersion?.versionNumber})`}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-[4/3] sm:aspect-[16/10] w-full bg-black/90 flex items-center justify-center overflow-hidden">
                {activeVersionUrl ? (
                  versions.length > 1 && !isOriginal && originalVersionUrl ? (
                    <BeforeAfterSlider
                      beforeImage={originalVersionUrl}
                      afterImage={activeVersionUrl}
                      beforeLabel="Foto Original"
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
              <div className="p-3 bg-secondary/30 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">Transformação aplicada: </span>
                  <span>{activeVersion.promptSummary}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Barra de Progresso Durante Processamento */}
          {isProcessing && (
            <Card className="border-amber-500/50 bg-amber-500/5 p-4 space-y-3">
              <Progress value={progressPercent} label={statusMessage} showValueLabel />
              <p className="text-xs text-muted-foreground text-center">
                Aguarde alguns segundos enquanto a IA gera a nova imagem com alta resolução...
              </p>
            </Card>
          )}

          {/* Linha do Tempo de Versões (Não Destrutivo) */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Galeria de Versões desta Foto
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  {versions.length} {versions.length === 1 ? 'versão' : 'versões'}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Clique em qualquer versão para visualizá-la, baixá-la ou usá-la como base para novas alterações.
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
                          ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5'
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
                          {ver.promptSummary || 'Original'}
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

      {/* Modal de Avaliação & Feedback do Assinante */}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="O que você achou do resultado?"
        description="Sua opinião é fundamental para aprimorarmos continuamente nossa inteligência artificial."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsFeedbackModalOpen(false)}>
              Depois
            </Button>
            <Button
              variant="gold"
              onClick={handleSubmitFeedback}
              isLoading={isSubmittingFeedback}
              loadingText="Enviando..."
              leftIcon={<Star className="h-4 w-4 fill-current" />}
            >
              Enviar Avaliação
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Estrelas 1 a 5 */}
          <div className="text-center space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
              Sua Nota
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setFeedbackRating(star)}
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= (hoverRating || feedbackRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-muted-foreground/30 hover:text-amber-400/50'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {feedbackRating === 5 && '⭐ Incrível! Ficou perfeita.'}
              {feedbackRating === 4 && '👍 Muito boa! Gostei do resultado.'}
              {feedbackRating === 3 && '👌 Ficou razoável.'}
              {feedbackRating === 2 && '👎 Não ficou como eu esperava.'}
              {feedbackRating === 1 && '⚠️ Não gostei.'}
            </p>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Sobre o que você quer falar?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'qualidade_ia', label: 'Qualidade da Foto' },
                { id: 'velocidade', label: 'Rapidez na Entrega' },
                { id: 'sugestao', label: 'Ideia / Sugestão' },
                { id: 'bug', label: 'Problema' },
                { id: 'geral', label: 'Geral' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFeedbackCategory(cat.id as any)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                    feedbackCategory === cat.id
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold'
                      : 'bg-card border-border text-muted-foreground hover:border-amber-500/40'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Seu comentário
            </label>
            <Textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Conte o que achou dos detalhes, cores ou nitidez da foto..."
              rows={4}
              className="text-xs"
            />
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação & Cotação de Créditos */}
      {quoteData && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Confirmar Transformação da Fotografia"
          description="Confira o resumo da sua alteração antes de iniciar."
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>
                Voltar e Ajustar
              </Button>
              <Button
                variant="gold"
                onClick={handleConfirmEdit}
                leftIcon={<Sparkles className="h-4 w-4" />}
                disabled={(quoteData.balance?.available ?? 0) < quoteData.credits}
                className="h-11 px-5 font-bold"
              >
                Confirmar ({quoteData.credits} {quoteData.credits === 1 ? 'Crédito' : 'Créditos'})
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* O que a IA fará */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider">
                Resumo da Edição
              </span>
              <p className="text-sm font-semibold text-foreground">
                {quoteData.humanFriendlySummary || naturalPrompt}
              </p>
            </div>

            {/* Custo */}
            <div className="p-3 rounded-lg bg-secondary/60 border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-bold text-foreground">
                {quoteData.credits} {quoteData.credits === 1 ? 'crédito' : 'créditos'} ({quoteData.priceInCents ? `R$ ${(quoteData.priceInCents / 100).toFixed(2).replace('.', ',')}` : 'R$ 7,90'})
              </span>
            </div>

            {/* Saldo */}
            <div className="p-3 rounded-lg bg-secondary/60 border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Seu Saldo Disponível:</span>
              <span className="font-mono font-bold text-foreground">
                {quoteData.balance.available} créditos
              </span>
            </div>

            {quoteData.balance.available < quoteData.credits && (
              <Alert variant="danger">
                Você não possui créditos suficientes. Adquira mais créditos na carteira para realizar esta edição.
              </Alert>
            )}

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              🛡️ <strong>Garantia Total:</strong> Seus créditos só são debitados definitivamente se a foto for entregue com sucesso.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
