import React from 'react';
import { cn } from './cn';
import { ImageOff } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-border/80 bg-card/40 max-w-lg mx-auto',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary text-muted-foreground mb-4 shadow-xs">
        {icon || <ImageOff className="h-7 w-7 opacity-80" />}
      </div>
      <h4 className="text-base font-bold text-foreground tracking-tight mb-1.5">{title}</h4>
      {description && (
        <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
