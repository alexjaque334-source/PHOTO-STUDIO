import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Dropzone,
  EmptyState,
  Skeleton,
  Alert,
  useToast,
} from '@/design-system';
import {
  Coins,
  Camera,
  Sparkles,
  History,
  ArrowRight,
  Plus,
  Clock,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, ImageSummary } from '@/lib/api-client';
import { generateThumbnail } from '@/lib/image-utils';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, walletBalance, refreshWallet } = useAuth();
  const { success, error } = useToast();

  const [images, setImages] = useState<ImageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.images
      .list({ limit: 8, sort: 'recent' })
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

  const handleQuickUpload = async (file: File) => {
    setIsUploading(true);
    try {
      let thumbBlob: Blob | undefined;
      try {
        thumbBlob = await generateThumbnail(file);
      } catch (tErr) {
        console.warn('Miniatura falhou, enviando sem ela:', tErr);
      }

      const res = await api.images.upload(file, thumbBlob);
      success(`Imagem "${file.name}" carregada com sucesso!`, 'Pronto para edição');
      navigate(`/studio/${res.image.id}`);
    } catch (err: any) {
      error(err.message || 'Falha ao enviar arquivo.', 'Erro no Upload');
    } finally {
      setIsUploading(false);
    }
  };

  const availableCredits = walletBalance?.available ?? 0;
  const purchasedCredits = walletBalance?.purchased ?? 0;
  const subscriptionCredits = walletBalance?.subscription ?? 0;
  const expiringCount = walletBalance?.expiringSoon?.length ?? 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Cabeçalho de Boas-vindas */}
      <PageHeader
        title={`Bem-vindo, ${user?.fullName.split(' ')[0] || 'Criador'}!`}
        description="Gerencie suas fotos de estúdio, acompanhe sua retenção de 90 dias e inicie novos aprimoramentos com inteligência artificial."
        badge={
          <Badge variant="gold" size="md">
            Studio Ativo
          </Badge>
        }
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Coins className="h-4 w-4 text-amber-500" />}
              onClick={() => navigate('/pricing')}
            >
              Comprar Créditos
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/studio')}
            >
              Novo Upload
            </Button>
          </div>
        }
      />

      {errorMessage && (
        <Alert variant="danger" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Grid de StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Saldo Disponível"
          value={availableCredits.toString()}
          variant="gold"
          icon={<Coins className="h-5 w-5" />}
          description={
            subscriptionCredits > 0
              ? `${subscriptionCredits} assinatura + ${purchasedCredits} avulsos`
              : `${purchasedCredits} créditos avulsos`
          }
        />
        <StatCard
          title="Imagens no Estúdio"
          value={isLoading ? '...' : images.length.toString()}
          icon={<Camera className="h-5 w-5" />}
          description="Até 90 dias de guarda segura"
        />
        <StatCard
          title="Créditos a Vencer"
          value={expiringCount.toString()}
          icon={<Clock className="h-5 w-5" />}
          description={expiringCount > 0 ? 'Atenção nos próximos dias' : 'Nenhum crédito próximo ao vencimento'}
        />
        <StatCard
          title="Proteção de Dados"
          value="100% LGPD"
          icon={<ShieldCheck className="h-5 w-5" />}
          description="R2 Privado com chave HMAC"
        />
      </div>

      {/* Seção de Upload Rápido e Projetos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Rápido Direto no Dashboard */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Upload Rápido
            </CardTitle>
            <CardDescription className="text-xs">
              Arraste sua foto para abrir instantaneamente no Cockpit de Edição.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dropzone
              onFileSelect={handleQuickUpload}
              disabled={isUploading}
            />
            {isUploading && (
              <p className="text-xs text-center text-primary animate-pulse font-medium">
                Enviando imagem ao estúdio privado...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Criações Recentes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                Criações Recentes
              </CardTitle>
              <CardDescription className="text-xs">
                Últimas fotos processadas e versões salvas no estúdio.
              </CardDescription>
            </div>
            {images.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/library')}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Ver Biblioteca
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-36 rounded-xl" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <EmptyState
                title="Nenhuma imagem enviada ainda"
                description="Seu estúdio está limpo e pronto! Envie sua primeira foto para aplicar as 14 ferramentas de inteligência artificial."
                action={
                  <Button variant="primary" size="sm" onClick={() => navigate('/studio')}>
                    Iniciar Primeira Edição
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.slice(0, 6).map((img) => (
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
                        <Camera className="h-8 w-8 text-muted-foreground/60" />
                      )}
                    </div>
                    <div className="p-2.5 space-y-1">
                      <p className="font-semibold text-xs text-foreground truncate">{img.title}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{img.versionCount} {img.versionCount === 1 ? 'versão' : 'versões'}</span>
                        <span
                          className={`font-medium ${
                            img.daysLeft <= 3
                              ? 'text-destructive font-bold'
                              : img.daysLeft <= 15
                              ? 'text-amber-500 font-semibold'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {img.daysLeft}d restantes
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Banner de Garantia de Retenção de 90 Dias */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <History className="h-5 w-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-foreground block">
              Garantia de Retenção Privativa de 90 Dias
            </span>
            <span className="text-muted-foreground">
              Seus arquivos originais e gerados ficam guardados de forma segura e inacessível a terceiros. Você pode exportar ou excluir a qualquer momento.
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/library')}
        >
          Gerenciar Arquivos
        </Button>
      </div>
    </div>
  );
};
