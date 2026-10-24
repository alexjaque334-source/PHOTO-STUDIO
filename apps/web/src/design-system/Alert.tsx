import React from 'react';
import { cn } from './cn';
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant;
  title?: React.ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  children,
  onClose,
  ...props
}) => {
  const variantStyles: Record<AlertVariant, string> = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200',
    danger: 'bg-destructive/10 border-destructive/30 text-destructive dark:text-red-300',
  };

  const iconMap: Record<AlertVariant, React.ReactNode> = {
    info: <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />,
    danger: <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-4 text-sm',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {iconMap[variant]}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold leading-tight">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar alerta"
          className="rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
