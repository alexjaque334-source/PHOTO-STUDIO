import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Button,
  IconButton,
  Input,
  Select,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Modal,
  EmptyState,
  Skeleton,
  Alert,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  useToast,
} from '@/design-system';
import {
  Camera,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  MoreVertical,
  Plus,
  Clock,
  AlertTriangle,
  History,
} from 'lucide-react';
import { api, ImageSummary } from '@/lib/api-client';
import { convertAndDownload } from '@/lib/image-utils';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [images, setImages] = useState<ImageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'expiring'>('recent');

  // Modal de Exclusão Antecipada
  const [deleteTarget, setDeleteTarget] = useState<ImageSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const res = await api.images.list({ sort: sortBy, limit: 50 });
      setImages(res.items || []);
    } catch (err: any) {
      error(err.message || 'Falha ao buscar galeria de imagens.', 'Erro');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [sortBy]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.images.delete(deleteTarget.id);
      success(`Imagem "${deleteTarget.title}" excluída permanentemente.`, 'Exclusão Concluída');
      setImages((prev) => prev.filter((img) => img.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      error(err.message || 'Não foi possível excluir a imagem.', 'Falha');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDirectDownload = async (img: ImageSummary) => {
    try {
      const urlRes = await api.images.getVersionUrl(img.id, img.currentVersionId, { variant: 'full' });
      await convertAndDownload(urlRes.url, img.title, 'png');
      success(`Download de "${img.title}" iniciado!`, 'Download');
    } catch (err: any) {
      error(err.message || 'Falha ao baixar imagem.', 'Erro');
    }
  };

  const filteredImages = images.filter((img) =>
    img.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Biblioteca de Imagens"
        description="Acompanhe todas as fotos armazenadas com segurança no Cloudflare R2 e gerencie o ciclo de retenção de 90 dias."
        badge={<Badge variant="secondary">Retenção Ativa</Badge>}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/studio')}
          >
            Novo Upload
          </Button>
        }
      />

      {/* Controles de Busca e Ordenação */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Buscar por título da foto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <div className="w-full sm:w-60">
          <Select
            label=""
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'expiring')}
            options={[
              { value: 'recent', label: 'Mais recentes primeiro' },
              { value: 'expiring', label: 'Próximas a expirar (Retenção)' },
            ]}
          />
        </div>
      </div>

      {/* Grid de Imagens */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filteredImages.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'Nenhuma foto encontrada' : 'Sua biblioteca está vazia'}
          description={
            searchQuery
              ? `Nenhum resultado corresponde à busca "${searchQuery}".`
              : 'Faça upload de fotos para aplicar as 14 ferramentas de estúdio com inteligência artificial.'
          }
          action={
            <Button variant="primary" onClick={() => navigate('/studio')}>
              Fazer Primeiro Upload
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredImages.map((img) => {
            // Badges de Retenção
            const isCritical = img.daysLeft <= 3;
            const isWarning = img.daysLeft > 3 && img.daysLeft <= 15;

            return (
              <Card
                key={img.id}
                className="group flex flex-col justify-between overflow-hidden hover:border-primary/60 transition-all hover:shadow-lg"
              >
                <div
                  onClick={() => navigate(`/studio/${img.id}`)}
                  className="aspect-square bg-secondary/60 relative overflow-hidden cursor-pointer"
                >
                  {img.thumbUrl ? (
                    <img
                      src={img.thumbUrl}
                      alt={img.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Camera className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                  )}

                  {/* Badge de Retenção Sobreposta */}
                  <div className="absolute top-2.5 right-2.5">
                    <Badge
                      variant={isCritical ? 'danger' : isWarning ? 'warning' : 'secondary'}
                      size="sm"
                      className="shadow-sm font-semibold"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {img.daysLeft}d restantes
                    </Badge>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-foreground truncate flex-1" title={img.title}>
                      {img.title}
                    </h3>
                    <DropdownMenu
                      trigger={
                        <IconButton aria-label="Mais opções" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </IconButton>
                      }
                    >
                      <DropdownMenuItem
                        icon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => navigate(`/studio/${img.id}`)}
                      >
                        Abrir no Studio
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        icon={<Download className="h-3.5 w-3.5" />}
                        onClick={() => handleDirectDownload(img)}
                      >
                        Download Direto (PNG)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        danger
                        onClick={() => setDeleteTarget(img)}
                      >
                        Excluir Permanentemente
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{img.versionCount} {img.versionCount === 1 ? 'versão' : 'versões'}</span>
                    <span className="text-[11px] font-mono">
                      {new Date(img.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-secondary/30 border-t border-border/60 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => navigate(`/studio/${img.id}`)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                    onClick={() => handleDirectDownload(img)}
                  >
                    Baixar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Exclusão Antecipada */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Exclusão Antecipada Permanente"
          description="Você está solicitando a eliminação imediata de todos os arquivos e versões desta imagem do Cloudflare R2."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                isLoading={isDeleting}
                loadingText="Excluindo do R2..."
                onClick={handleDeleteConfirm}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Sim, Excluir Definitivamente
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/60 border border-border text-xs">
              <span className="text-muted-foreground block">Arquivo selecionado:</span>
              <span className="font-bold text-foreground text-sm">{deleteTarget.title}</span>
            </div>
            <Alert variant="danger">
              Esta ação é irreversível conforme a LGPD. Todos os dados brutos e versões derivadas serão removidos dos servidores imediatamente.
            </Alert>
          </div>
        </Modal>
      )}
    </div>
  );
};
