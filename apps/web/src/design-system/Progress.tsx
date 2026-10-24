import React from 'react';
import { cn } from './cn';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 a 100
  max?: number;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showValueLabel?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  indeterminate = false,
  size = 'md',
  label,
  showValueLabel = false,
  className,
  ...props
}) => {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)} {...props}>
      {(label || showValueLabel) && (
        <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
          {label && <span>{label}</span>}
          {showValueLabel && !indeterminate && (
            <span className="font-mono">{Math.round(percentage)}%</span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progresso da operação'}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-secondary border border-border/40',
          sizeStyles[size]
        )}
      >
        {indeterminate ? (
          <div className="h-full w-1/3 rounded-full bg-primary animate-[indeterminate_1.5s_infinite_linear]" />
        ) : (
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
};
