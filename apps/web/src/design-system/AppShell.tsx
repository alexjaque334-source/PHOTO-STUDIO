import React, { useState } from 'react';
import { cn } from './cn';
import { Logo } from './Logo';
import { ThemeToggle } from './Theme';
import { Badge } from './Badge';
import { Button } from './Button';
import { Drawer } from './Drawer';
import { InstallAppModal } from './InstallAppModal';
import {
  Sparkles,
  Image,
  Wallet,
  CreditCard,
  ShieldAlert,
  Menu,
  Coins,
  LogOut,
  Sliders,
  LayoutDashboard,
  User,
  Smartphone,
  Download,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string;
  isAdmin?: boolean;
}

export interface AppShellProps {
  children: React.ReactNode;
  user?: {
    fullName: string;
    email: string;
    avatarUrl?: string;
    isAdmin?: boolean;
  };
  creditsBalance?: {
    available: number;
    expiringSoonCount?: number;
  };
  navItems?: NavItem[];
  onNavigate?: (href: string) => void;
  onLogout?: () => void;
  currentPath?: string;
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  user = { fullName: 'Alexandre Silva', email: 'usuario@photostudio.ai', isAdmin: false },
  creditsBalance = { available: 42, expiringSoonCount: 0 },
  navItems,
  onNavigate,
  onLogout,
  currentPath = '/studio',
  className,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  const defaultNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      active: currentPath === '/dashboard',
    },
    {
      label: 'Biblioteca',
      href: '/library',
      icon: <Image className="h-4 w-4" />,
      active: currentPath.startsWith('/library'),
    },
    {
      label: 'Carteira & Extrato',
      href: '/wallet',
      icon: <Wallet className="h-4 w-4" />,
      active: currentPath.startsWith('/wallet'),
    },
    {
      label: 'Planos & Créditos',
      href: '/pricing',
      icon: <CreditCard className="h-4 w-4" />,
      active: currentPath.startsWith('/pricing'),
    },
    {
      label: 'Minha Conta',
      href: '/account',
      icon: <User className="h-4 w-4" />,
      active: currentPath.startsWith('/account'),
    },
    ...(user?.isAdmin
      ? [
          {
            label: 'Painel Admin',
            href: '/admin',
            icon: <ShieldAlert className="h-4 w-4" />,
            active: currentPath.startsWith('/admin'),
            isAdmin: true,
          },
        ]
      : []),
  ];

  const items = navItems || defaultNavItems;

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    onNavigate?.(href);
  };

  return (
    <div className={cn('min-h-screen bg-background text-foreground flex flex-col w-full max-w-full overflow-x-hidden', className)}>
      {/* Barra de Topo Geral */}
      <header className="sticky top-0 z-40 w-full max-w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-3 sm:px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu de navegação"
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Menu className="h-5 w-5" />
            </button>

            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('/');
              }}
              className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            >
              <Logo size="md" />
            </a>
          </div>

          {/* Área de Ações à Direita: Saldo de Créditos, Alternador de Tema e Usuário */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão de Instalar App no Celular / Computador */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInstallModalOpen(true)}
              leftIcon={<Smartphone className="h-3.5 w-3.5 text-primary" />}
              className="hidden sm:inline-flex text-xs font-semibold border-primary/30 hover:border-primary/60 text-foreground"
            >
              Instalar App
            </Button>
            <button
              type="button"
              onClick={() => setInstallModalOpen(true)}
              title="Instalar App no Celular (Apple & Android)"
              aria-label="Instalar App"
              className="sm:hidden p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Saldo de Créditos em Ouro */}
            <div
              onClick={() => handleNavClick('/wallet')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold hover:bg-amber-500/20 transition-colors cursor-pointer select-none"
              title="Ver detalhes da sua carteira"
            >
              <Coins className="h-3.5 w-3.5 text-amber-500" />
              <span>{creditsBalance.available}</span>
              <span className="hidden sm:inline font-sans font-normal opacity-80">créditos</span>
            </div>

            <ThemeToggle />

            {/* Avatar / Usuário */}
            <div className="flex items-center gap-2 pl-2 border-l border-border/60">
              <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs select-none">
                {user.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold leading-tight">{user.fullName}</span>
                  {user.isAdmin && (
                    <Badge variant="danger" size="sm" className="text-[9px] py-0 px-1 font-bold uppercase">
                      Admin
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">{user.email}</span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Encerrar Sessão (Deslogar)"
                  aria-label="Encerrar Sessão"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal com Sidebar Desktop */}
      <div className="flex-1 flex w-full">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-border/80 bg-card/40 p-4 justify-between shrink-0">
          <nav className="space-y-1" aria-label="Navegação do estúdio">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Menu do Studio
            </div>
            {items.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  'flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 select-none cursor-pointer',
                  item.active
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(item.active ? 'text-primary-foreground' : 'text-muted-foreground')}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="gold" size="sm">
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          {/* Bloco de Retenção & Logout */}
          <div className="pt-4 border-t border-border/60 space-y-3">
            <div className="p-2.5 rounded-xl bg-secondary/60 border border-border/50 text-[11px]">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Retenção Segura: 90 dias
              </span>
            </div>

            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                leftIcon={<LogOut className="h-4 w-4" />}
                onClick={onLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                Encerrar Sessão
              </Button>
            )}
          </div>
        </aside>

        {/* Drawer Mobile */}
        <Drawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          title="Menu Photo Studio AI"
          position="left"
        >
          <div className="flex flex-col h-full justify-between gap-6">
            <nav className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    'flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors',
                    item.active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && <Badge variant="gold">{item.badge}</Badge>}
                </button>
              ))}
            </nav>

            {onLogout && (
              <Button
                variant="outline"
                size="md"
                fullWidth
                leftIcon={<LogOut className="h-4 w-4" />}
                onClick={onLogout}
              >
                Encerrar Sessão
              </Button>
            )}
          </div>
        </Drawer>

        {/* Área de Trabalho / Workspace Central */}
        <main className="flex-1 min-w-0 max-w-full p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>

      {/* Barra de Navegação Inferior Mobile (Padrão WhatsApp & App Nativo / Ergonomia de Polegar) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 px-2 py-1.5 pb-[max(env(safe-area-inset-bottom),0.6rem)] flex items-center justify-around shadow-lg"
        aria-label="Navegação rápida do celular"
      >
        <button
          type="button"
          onClick={() => handleNavClick('/dashboard')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 min-w-0 py-1 px-1 rounded-xl text-[11px] font-medium transition-all select-none',
            currentPath === '/dashboard'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <LayoutDashboard className="h-5 w-5 mb-0.5" />
          <span className="truncate">Início</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const lastId = typeof window !== 'undefined' ? localStorage.getItem('ps_last_active_image_id') : null;
            handleNavClick(lastId ? `/studio/${lastId}` : '/studio');
          }}
          className={cn(
            'flex flex-col items-center justify-center flex-1 min-w-0 py-1 px-1 rounded-xl text-[11px] font-medium transition-all select-none',
            currentPath.startsWith('/studio')
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Sparkles className="h-5 w-5 mb-0.5 text-primary" />
          <span className="truncate">Studio</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('/library')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 min-w-0 py-1 px-1 rounded-xl text-[11px] font-medium transition-all select-none',
            currentPath.startsWith('/library')
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Image className="h-5 w-5 mb-0.5" />
          <span className="truncate">Fotos</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('/pricing')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 min-w-0 py-1 px-1 rounded-xl text-[11px] font-medium transition-all select-none',
            currentPath.startsWith('/pricing')
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <CreditCard className="h-5 w-5 mb-0.5" />
          <span className="truncate">Planos</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('/account')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 min-w-0 py-1 px-1 rounded-xl text-[11px] font-medium transition-all select-none',
            currentPath.startsWith('/account')
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <User className="h-5 w-5 mb-0.5" />
          <span className="truncate">Perfil</span>
        </button>
      </nav>

      {/* Modal de Instalação do Aplicativo (Apple & Android) */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />
    </div>
  );
};
