import React, { useState } from 'react';
import { cn } from './cn';
import { Logo } from './Logo';
import { Badge } from './Badge';
import { Button } from './Button';
import { ThemeToggle } from './Theme';
import { Drawer } from './Drawer';
import {
  ShieldAlert,
  LogOut,
  Menu,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';

export interface AdminShellProps {
  children: React.ReactNode;
  userEmail?: string;
  onLogout?: () => void;
  className?: string;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  children,
  userEmail = 'apacessoria25@gmail.com',
  onLogout,
  className,
}) => {
  return (
    <div className={cn('min-h-screen bg-background text-foreground flex flex-col', className)}>
      {/* Barra de Topo Executiva Exclusiva do Administrador */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md shadow-xs">
        <div className="flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            >
              <Logo size="md" />
            </a>
            <div className="h-4 w-px bg-border/80 hidden sm:block" />
            <Badge variant="danger" size="md" className="uppercase font-bold tracking-wider text-[10px] py-0.5 px-2">
              Cockpit Executivo
            </Badge>
          </div>

          {/* Área Direita: Identificação do Super Admin e Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />

            <div className="flex items-center gap-2.5 pl-3 border-l border-border/70">
              <div className="h-8 w-8 rounded-full bg-destructive/15 text-destructive flex items-center justify-center font-bold text-xs select-none border border-destructive/30">
                AD
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">Super Administrador</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">{userEmail}</span>
              </div>
            </div>

            {onLogout && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<LogOut className="h-3.5 w-3.5" />}
                onClick={onLogout}
                className="text-muted-foreground hover:text-destructive hover:border-destructive/40 text-xs"
              >
                Sair
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Painel de Administração */}
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
