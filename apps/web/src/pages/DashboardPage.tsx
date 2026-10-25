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
  Dropzone,
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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, ImageSummary } from '@/lib/api-client';
import { generateThumbnail } from '@/lib/image-utils';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, walletBalance } = useAuth();
  const { success, error } = useToast();

  const [images, setImages] = useState<ImageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);

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
    };
  }, []);

  const handleProcessFile = async (file: File) => {
    setIsUploading(true);
    try {
      let thumbBlob: Blob | undefined;
      try {
        thumbBlob = await generateThumbnail(file);
      } catch (tErr) {
        console.warn('Miniatura falhou, prosseguindo com upload:', tErr);
      }

      const res = await api.images.upload(file, thumbBlob);
      success(`Imagem "${file.name}" carregada com sucesso!`, 'Abrindo Studio de Edição...');
      navigate(`/studio/${res.image.id}`);
    } catch (err: any) {
      error(err.message || 'Falha ao enviar arquivo.', 'Erro no Upload');
    } finally {
      setIsUploading(false);
    }
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
            className="bg-amber-600 hover:bg-amber-700 text-white border-none shrink-0 font-medium"
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
            className="text-xs"
          >
            Recarregar
          </Button>
        </div>
      </div>

      {/* ── ÁREA DE UPLOAD ESPECÍFICA PARA CELULAR (Mobile Only) ── */}
      <div className="block md:hidden">
        <Card className="border-primary/40 bg-card shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto p-3 rounded-2xl bg-primary/10 text-primary w-fit mb-2">
              <Smartphone className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Upload Rápido no Celular</CardTitle>
            <CardDescription className="text-xs">
              Tire uma foto agora ou escolha uma imagem da sua galeria para editar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <input
              type="file"
              ref={mobileCameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleMobileInputChange}
              disabled={isUploading}
            />
            <input
              type="file"
              ref={mobileFileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleMobileInputChange}
              disabled={isUploading}
            />

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={isUploading}
              isLoading={isUploading}
              loadingText="Enviando foto..."
              leftIcon={<Camera className="h-5 w-5" />}
              onClick={() => mobileCameraInputRef.current?.click()}
              className="h-12 text-sm font-semibold"
            >
              Tirar Foto com a Câmera
            </Button>

            <Button
              variant="outline"
              size="lg"
              fullWidth
              disabled={isUploading}
              leftIcon={<Upload className="h-5 w-5" />}
              onClick={() => mobileFileInputRef.current?.click()}
              className="h-12 text-sm font-semibold"
            >
              Escolher da Galeria
            </Button>

            {isUploading && (
              <p className="text-xs text-center text-primary animate-pulse font-medium pt-2">
                Enviando imagem ao estúdio privado...
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── ÁREA DE UPLOAD ESPECÍFICA PARA PC / DESKTOP (Desktop Only) ── */}
      <div className="hidden md:block">
        <Card className="border-border hover:border-primary/50 transition-colors shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  Upload para Edição
                </CardTitle>
                <CardDescription className="text-xs">
                  Arraste ou selecione a foto para abrir instantaneamente no Cockpit de Edição.
                </CardDescription>
              </div>
              <Badge variant="secondary" size="sm">
                JPG, PNG, WebP até 25MB
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Dropzone
              onFileSelect={handleProcessFile}
              disabled={isUploading}
            />
            {isUploading && (
              <p className="text-xs text-center text-primary animate-pulse font-medium mt-3">
                Processando e carregando foto no estúdio...
              </p>
            )}
          </CardContent>
        </Card>
      </div>

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
                Envie sua primeira foto na área de upload acima para aplicar aprimoramentos com inteligência artificial.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => navigate(`/studio/${img.id}`)}
                  className="group relative rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/60 transition-all hover:shadow-md"
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
