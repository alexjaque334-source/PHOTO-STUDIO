import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton,
  Alert,
  useToast,
} from '@/design-system';
import {
  Coins,
  Camera,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Upload,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Mic,
  MicOff,
  RotateCcw,
  FlipHorizontal,
  X,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, ImageSummary } from '@/lib/api-client';
import { generateThumbnail } from '@/lib/image-utils';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, walletBalance } = useAuth();
  const { success, error, info } = useToast();

  const [images, setImages] = useState<ImageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Estados da Câmera Integrada & Foto Instantânea ──
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [cameraPrompt, setCameraPrompt] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Saudação de acordo com o horário local
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Criador';
  const availableCredits = walletBalance?.available ?? 0;

  useEffect(() => {
    let isMounted = true;
    api.images
      .list({ limit: 6, sort: 'recent' })
      .then((res) => {
        if (!isMounted) return;
        setImages(res.items || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Falha ao sincronizar criações recentes.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      stopCameraStream();
    };
  }, []);

  // Parar stream da câmera com segurança
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Iniciar câmera do aparelho
  const handleStartCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    setIsCameraOpen(true);
    setCapturedPhotoUrl(null);
    setCapturedFile(null);
    setCameraPrompt('');
    stopCameraStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Acesso à webcam/câmera bloqueado ou indisponível:', err);
      // Fallback: aciona input nativo de câmera do celular
      stopCameraStream();
      setIsCameraOpen(false);
      mobileCameraInputRef.current?.click();
    }
  };

  // Alternar entre câmera frontal e traseira
  const handleFlipCamera = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    handleStartCamera(nextFacing);
  };

  // Disparar e capturar o frame da foto
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Se for selfie frontal, espelha para ficar natural como foto de celular
    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setCapturedPhotoUrl(url);
        setCapturedFile(file);
        stopCameraStream();
      },
      'image/jpeg',
      0.95
    );
  };

  // Cancelar captura e voltar
  const handleCancelCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCapturedPhotoUrl(null);
    setCapturedFile(null);
    setCameraPrompt('');
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
          setCameraPrompt(transcript);
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

  // Upload e envio com pedido junto
  const handleExecutePhotoAndPrompt = async () => {
    if (!capturedFile) return;

    setIsUploading(true);
    try {
      let thumbBlob: Blob | undefined;
      try {
        thumbBlob = await generateThumbnail(capturedFile);
      } catch (tErr) {
        console.warn('Miniatura falhou, prosseguindo com upload:', tErr);
      }

      const res = await api.images.upload(capturedFile, thumbBlob);
      const promptQuery = cameraPrompt.trim()
        ? `?prompt=${encodeURIComponent(cameraPrompt.trim())}`
        : '';
      success('Foto capturada e carregada com sucesso!', 'Iniciando Transformação');
      navigate(`/studio/${res.image.id}${promptQuery}`);
    } catch (err: any) {
      error(err.message || 'Falha ao processar foto.', 'Erro');
    } finally {
      setIsUploading(false);
    }
  };

  // Processar arquivo vindo de upload tradicional (Galeria / Dropzone)
  const handleProcessFile = async (file: File) => {
    // Se o usuário selecionou da galeria, também permite pré-visualizar e pedir a mudança junto!
    const previewUrl = URL.createObjectURL(file);
    setCapturedPhotoUrl(previewUrl);
    setCapturedFile(file);
    setIsCameraOpen(true);
  };

  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) handleProcessFile(file);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Lembrete de Segurança 2FA (Faixa Amarela) ── */}
      {!user?.mfaEnabled && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">
                Ative a Segurança em Dois Fatores (2FA / MFA)
              </span>
              <p className="text-xs text-muted-foreground">
                Proteja sua conta, suas fotos originais e seus créditos contra tentativas de invasão.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/account')}
            className="bg-amber-600 hover:bg-amber-700 text-white border-none shrink-0 font-medium h-10 px-4"
            leftIcon={<ShieldCheck className="h-4 w-4" />}
          >
            Configurar 2FA Agora
          </Button>
        </div>
      )}

      {errorMessage && (
        <Alert variant="danger" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* ── Cabeçalho Objetivo: Saudação & Saldo de Créditos ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Seu estúdio inteligente de criação e edição fotográfica.
          </p>
        </div>

        {/* Pílula de Saldo de Créditos */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold cursor-pointer hover:bg-amber-500/20 transition-all select-none"
            title="Clique para ver extrato detalhado de créditos"
          >
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="text-sm">{availableCredits}</span>
            <span className="font-sans font-medium text-xs opacity-90">
              {availableCredits === 1 ? 'crédito' : 'créditos'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/pricing')}
            className="text-xs h-9 px-3"
          >
            Recarregar
          </Button>
        </div>
      </div>

      {/* ── ÁREA CENTRAL: CÂMERA INTEGRADA & PEDIDO DIRETO (MESMO LUGAR, TAMANHO WHATSAPP) ── */}
      <Card className="border-border shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60 bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle className="text-base font-bold">
                  {isCameraOpen
                    ? capturedPhotoUrl
                      ? 'Sua Foto + O que você quer mudar'
                      : 'Câmera ao Vivo'
                    : 'Tirar Foto ou Escolher Imagem'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isCameraOpen
                    ? capturedPhotoUrl
                      ? 'Fale no microfone ou digite o que quer transformar nesta foto!'
                      : 'Posicione a câmera e aperte o botão para capturar.'
                    : 'Tire uma foto agora e já peça a transformação em uma única tela simples.'}
                </CardDescription>
              </div>
            </div>
            {isCameraOpen && (
              <button
                type="button"
                onClick={handleCancelCamera}
                className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                title="Fechar câmera"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Inputs nativos ocultos como fallback confiável */}
          <input
            type="file"
            ref={mobileCameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleMobileInputChange}
          />
          <input
            type="file"
            ref={mobileFileInputRef}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleMobileInputChange}
          />

          {/* MODO 1: CÂMERA AO VIVO ABERTA */}
          {isCameraOpen && !capturedPhotoUrl && (
            <div className="space-y-4">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] max-h-[460px] w-full bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    cameraFacing === 'user' ? 'scale-x-[-1]' : ''
                  }`}
                />

                {/* Botão de Trocar Câmera (Frontal / Traseira) */}
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="absolute top-4 right-4 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all shadow-lg active:scale-95"
                  title="Trocar Câmera"
                >
                  <FlipHorizontal className="h-5 w-5" />
                </button>
              </div>

              {/* Botão de Disparo Estilo WhatsApp (64px, Grande e Amigável) */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <button
                  type="button"
                  onClick={handleCancelCamera}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="w-16 h-16 rounded-full border-4 border-white bg-amber-500 hover:bg-amber-400 active:scale-90 transition-transform shadow-xl flex items-center justify-center text-white"
                  title="Tirar Foto"
                >
                  <Camera className="h-7 w-7" />
                </button>

                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  Virar Câmera
                </button>
              </div>
            </div>
          )}

          {/* MODO 2: FOTO CAPTURADA + PEDIDO JUNTO (TUDO NA MESMA TELA) */}
          {capturedPhotoUrl && (
            <div className="space-y-5 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Prévia da Foto */}
                <div className="md:col-span-5 space-y-2">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-black/80 shadow-md">
                    <img
                      src={capturedPhotoUrl}
                      alt="Foto capturada"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Foto pronta para a IA</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartCamera(cameraFacing)}
                      leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Tirar Outra Foto
                    </Button>
                  </div>
                </div>

                {/* Pedido de Transformação com Microfone de Voz WhatsApp */}
                <div className="md:col-span-7 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground flex items-center justify-between">
                      <span>O que você quer mudar nesta foto?</span>
                      <Badge variant="gold" size="sm">
                        IA Pronta
                      </Badge>
                    </label>

                    {/* Campo com Microfone Integrado (Tamanho WhatsApp) */}
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={cameraPrompt}
                        onChange={(e) => setCameraPrompt(e.target.value)}
                        placeholder="Escreva do seu jeito ou toque no microfone verde para falar..."
                        className="w-full rounded-2xl border border-border bg-background p-3.5 pr-14 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none font-normal"
                      />

                      {/* Botão de Microfone de Voz (WhatsApp Size: 48px) */}
                      <button
                        type="button"
                        onClick={handleToggleVoice}
                        className={`absolute right-2.5 bottom-3.5 w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 ${
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
                        Ouvindo você... Fale o que quer mudar na foto!
                      </p>
                    )}
                  </div>

                  {/* Botão "Me dê ideias para esta foto" */}
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
                      <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-secondary/50 border border-border/60">
                        {[
                          { label: '✨ Retrato de Estúdio', text: 'Transforme num retrato profissional de estúdio fotográfico' },
                          { label: '🏖️ Praia no Pôr do Sol', text: 'Muda o fundo para uma praia paradisíaca no pôr do sol' },
                          { label: '👔 Foto Executiva LinkedIn', text: 'Deixa com cara de foto corporativa executiva profissional' },
                          { label: '👥 Tirar Pessoas do Fundo', text: 'Remove todas as pessoas indesejadas do fundo da foto' },
                          { label: '💎 Pele Perfeita e Nitidez', text: 'Melhora a nitidez nos olhos e iluminação natural suave' },
                        ].map((idea, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCameraPrompt(idea.text)}
                            className="px-2.5 py-1 rounded-full bg-background border border-border text-[11px] text-foreground/90 hover:border-amber-500/50 hover:bg-amber-500/10 transition-colors"
                          >
                            {idea.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botão de Envio WhatsApp Size (52px de altura) */}
                  <div className="pt-2">
                    <Button
                      variant="gold"
                      fullWidth
                      onClick={handleExecutePhotoAndPrompt}
                      isLoading={isUploading}
                      loadingText="Criando sua foto com IA..."
                      leftIcon={<Sparkles className="h-5 w-5" />}
                      className="h-13 text-sm font-bold shadow-lg"
                    >
                      🚀 Criar Minha Foto com IA
                    </Button>
                    <p className="text-[11px] text-center text-muted-foreground mt-2">
                      Você verá o Antes e Depois imediatamente na próxima tela com garantia total de satisfação.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODO 3: TELA PADRÃO INICIAL (BOTÕES GRANDES TAMANHO WHATSAPP) */}
          {!isCameraOpen && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Botão 1: Câmera Integrada */}
                <button
                  type="button"
                  onClick={() => handleStartCamera('user')}
                  className="h-14 sm:h-16 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-md transition-all group"
                >
                  <Camera className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <span>📸 Tirar Foto & Criar na Hora</span>
                </button>

                {/* Botão 2: Escolher da Galeria / Computador */}
                <button
                  type="button"
                  onClick={() => mobileFileInputRef.current?.click()}
                  className="h-14 sm:h-16 px-6 rounded-2xl bg-secondary/80 hover:bg-secondary active:scale-[0.98] border border-border text-foreground font-semibold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xs transition-all"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span>📁 Escolher Foto da Galeria</span>
                </button>
              </div>

              {/* Informação e Garantia Simples */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 px-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Suas fotos originais ficam salvas com segurança máxima.
                </span>
                <span>Formatos aceitos: JPG, PNG e WebP</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Fotos Recentes (Acesso Direto ao Studio) ── */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              Fotos Recentes
            </CardTitle>
            <CardDescription className="text-xs">
              Clique em qualquer imagem para continuar editando no estúdio.
            </CardDescription>
          </div>
          {images.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/library')}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              Ver Biblioteca
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground space-y-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium">Nenhuma foto enviada ainda.</p>
              <p className="text-[11px] text-muted-foreground/80 max-w-sm mx-auto">
                Tire sua primeira foto acima para criar retratos incríveis com inteligência artificial.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => navigate(`/studio/${img.id}`)}
                  className="group relative rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:border-amber-500/60 transition-all hover:shadow-md"
                >
                  <div className="aspect-square bg-secondary/60 flex items-center justify-center overflow-hidden">
                    {img.thumbUrl ? (
                      <img
                        src={img.thumbUrl}
                        alt={img.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <Camera className="h-6 w-6 text-muted-foreground/60" />
                    )}
                  </div>
                  <div className="p-2 space-y-0.5">
                    <p className="font-semibold text-[11px] text-foreground truncate">{img.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {img.daysLeft}d restantes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
