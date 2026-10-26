import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { usePwaInstall } from '@/lib/usePwaInstall';
import {
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  Download,
  Apple,
  Chrome,
  Laptop,
  Check,
} from 'lucide-react';

export interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isIOS, isAndroid, hasNativePrompt, isInstalled, triggerNativeInstall } = usePwaInstall();
  const [activeTab, setActiveTab] = useState<'apple' | 'android'>(isIOS ? 'apple' : 'android');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  const handleNativeClick = async () => {
    setIsInstalling(true);
    try {
      const outcome = await triggerNativeInstall();
      if (outcome === 'accepted') {
        setInstalledSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              Instalar Aplicativo Photo Studio
              <Badge variant="success" size="sm" className="hidden sm:inline-flex text-[10px]">
                Apple & Android
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Tenha o estúdio em tela cheia no seu celular ou computador sem ocupar espaço.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Sem precisar baixar da Play Store ou App Store (Instantâneo)</span>
          </div>
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Fechar
          </Button>
        </div>
      }
    >
      <div className="space-y-6 py-1">
        {/* Vantagens do App */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-2.5 rounded-xl bg-card border border-border/80 flex flex-col items-center">
            <Sparkles className="w-4 h-4 text-primary mb-1" />
            <span className="text-[11px] font-semibold text-foreground">1 Toque</span>
            <span className="text-[10px] text-muted-foreground">Acesso direto</span>
          </div>
          <div className="p-2.5 rounded-xl bg-card border border-border/80 flex flex-col items-center">
            <Smartphone className="w-4 h-4 text-purple-400 mb-1" />
            <span className="text-[11px] font-semibold text-foreground">Tela Cheia</span>
            <span className="text-[10px] text-muted-foreground">Sem barra do browser</span>
          </div>
          <div className="p-2.5 rounded-xl bg-card border border-border/80 flex flex-col items-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[11px] font-semibold text-foreground">Leve & Rápido</span>
            <span className="text-[10px] text-muted-foreground">Não pesa na memória</span>
          </div>
          <div className="p-2.5 rounded-xl bg-card border border-border/80 flex flex-col items-center">
            <Laptop className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[11px] font-semibold text-foreground">Multiplataforma</span>
            <span className="text-[10px] text-muted-foreground">iOS, Android e PC</span>
          </div>
        </div>

        {/* Alternador de Plataforma: Apple iOS vs Android / Computador */}
        <div className="flex p-1 bg-secondary rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('apple')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'apple'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Apple className="w-4 h-4 text-foreground" />
            <span>Apple (iPhone & iPad)</span>
            {isIOS && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'android'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Chrome className="w-4 h-4 text-emerald-500" />
            <span>Android & Computador</span>
            {isAndroid && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Conteúdo da Aba Apple */}
        {activeTab === 'apple' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                Como instalar no iPhone ou iPad (Safari)
              </div>
              <ol className="space-y-3 text-xs text-foreground/90 leading-relaxed list-none">
                <li className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    No navegador <strong>Safari</strong> do iPhone, toque no botão de{' '}
                    <strong className="inline-flex items-center gap-1 text-primary">
                      <Share className="w-3.5 h-3.5" /> Compartilhar
                    </strong>{' '}
                    (o ícone de quadrado com seta para cima localizado na barra inferior).
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    Role o menu para baixo e toque em{' '}
                    <strong className="inline-flex items-center gap-1 text-primary">
                      <PlusSquare className="w-3.5 h-3.5" /> Adicionar à Tela de Início
                    </strong>.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    No canto superior direito, confirme tocando em <strong>Adicionar</strong>. Pronto! O Photo Studio AI aparecerá na sua tela de aplicativos como um app nativo.
                  </div>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba Android & Computador */}
        {activeTab === 'android' && (
          <div className="space-y-4">
            {hasNativePrompt ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <h3 className="text-sm font-bold text-foreground">
                  Instalação com 1 Clique Disponível!
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Seu navegador é 100% compatível com a instalação direta. Clique no botão abaixo para adicionar o app à sua tela inicial.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  leftIcon={installedSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  onClick={handleNativeClick}
                  isLoading={isInstalling}
                  disabled={installedSuccess}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {installedSuccess ? 'Aplicativo Instalado!' : 'Instalar Aplicativo Agora'}
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-secondary/60 border border-border/80 space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Como instalar no Android, Chrome, Edge ou Samsung Internet
                </div>
                <ol className="space-y-3 text-xs text-foreground/90 leading-relaxed list-none">
                  <li className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      Toque nos <strong>3 pontinhos do menu</strong> do seu navegador (no topo direito no Google Chrome ou no canto inferior no Samsung Internet).
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      Selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      Confirme em <strong>"Instalar"</strong>. O aplicativo será instalado no seu aparelho com ícone oficial e acesso instantâneo.
                    </div>
                  </li>
                </ol>
              </div>
            )}
          </div>
        )}

        {isInstalled && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Você já está executando o aplicativo no modo instalado!</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
