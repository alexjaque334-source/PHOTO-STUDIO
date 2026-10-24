import React from 'react';
import { cn } from './cn';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
  | 'gold';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'sm',
  dot = false,
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground border-border/60',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-destructive/10 text-destructive border-destructive/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    outline: 'bg-transparent text-foreground border-border',
    gold: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30 font-semibold',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-primary',
    secondary: 'bg-muted-foreground',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-destructive',
    info: 'bg-blue-500',
    outline: 'bg-foreground',
    gold: 'bg-amber-400',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border select-none leading-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
