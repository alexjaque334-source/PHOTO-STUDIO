import React, { useEffect, useRef } from 'react';
import { cn } from './cn';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

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

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteúdo do Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full rounded-2xl bg-card border border-border shadow-2xl overflow-hidden transition-all duration-200 z-10 animate-in zoom-in-95 fade-in',
          sizeStyles[size],
          className
        )}
      >
        {/* Cabeçalho */}
        {(title || description) && (
          <div className="flex items-start justify-between p-6 border-b border-border/60">
            <div className="space-y-1">
              {title && (
                <h3 id="modal-title" className="text-lg font-bold text-foreground tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p id="modal-description" className="text-xs text-muted-foreground leading-normal">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar janela"
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-160px)]">{children}</div>

        {/* Rodapé Opcional */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 px-6 bg-secondary/30 border-t border-border/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
