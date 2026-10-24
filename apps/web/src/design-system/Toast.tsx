import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from './cn';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastItem {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => void;
  success: (description: string, title?: string) => void;
  error: (description: string, title?: string) => void;
  info: (description: string, title?: string) => void;
  warning: (description: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, description, variant = 'info', duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, title, description, variant, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (description: string, title?: string) => addToast({ description, title, variant: 'success' }),
    [addToast]
  );

  const error = useCallback(
    (description: string, title?: string) => addToast({ description, title, variant: 'danger' }),
    [addToast]
  );

  const info = useCallback(
    (description: string, title?: string) => addToast({ description, title, variant: 'info' }),
    [addToast]
  );

  const warning = useCallback(
    (description: string, title?: string) => addToast({ description, title, variant: 'warning' }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toast: addToast,
        success,
        error,
        info,
        warning,
        dismiss,
      }}
    >
      {children}
      {/* Toast Viewport flutuante no canto inferior direito */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider');
  }
  return context;
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  const iconMap: Record<ToastVariant, React.ReactNode> = {
    info: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
    danger: <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />,
  };

  const borderMap: Record<ToastVariant, string> = {
    info: 'border-blue-500/30',
    success: 'border-emerald-500/30',
    warning: 'border-amber-500/30',
    danger: 'border-destructive/30',
  };

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border bg-popover text-popover-foreground p-3.5 shadow-lg shadow-black/10 transition-all duration-200 select-none animate-in slide-in-from-bottom-2 fade-in',
        borderMap[toast.variant || 'info']
      )}
    >
      {iconMap[toast.variant || 'info']}
      <div className="flex-1 space-y-0.5">
        {toast.title && <h5 className="text-xs font-bold leading-tight">{toast.title}</h5>}
        <p className="text-xs text-muted-foreground leading-normal">{toast.description}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dispensar notificação"
        className="rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
