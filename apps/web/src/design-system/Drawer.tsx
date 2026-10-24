import React, { useEffect, useRef } from 'react';
import { cn } from './cn';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'right' | 'left' | 'bottom';
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  position = 'right',
  className,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionStyles = {
    right: 'inset-y-0 right-0 w-full max-w-md border-l animate-in slide-in-from-right duration-250',
    left: 'inset-y-0 left-0 w-full max-w-md border-r animate-in slide-in-from-left duration-250',
    bottom:
      'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t animate-in slide-in-from-bottom duration-250',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Painel do Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed flex flex-col bg-card text-card-foreground border-border shadow-2xl z-10',
          positionStyles[position],
          className
        )}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div className="space-y-0.5">
            {title && (
              <h3 id="drawer-title" className="text-base font-bold text-foreground tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground leading-normal">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Rodapé Opcional */}
        {footer && (
          <div className="p-4 px-5 bg-secondary/30 border-t border-border/60 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
