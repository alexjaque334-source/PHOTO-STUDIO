import React, { forwardRef } from 'react';
import { cn } from './cn';
import { Spinner } from './Spinner';

export type IconButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      children,
      disabled,
      type = 'button',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer';

    const variantStyles: Record<IconButtonVariant, string> = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50',
      outline: 'bg-transparent border border-border text-foreground hover:bg-secondary/60',
      ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/70',
      danger: 'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive',
    };

    const sizeStyles: Record<IconButtonSize, string> = {
      xs: 'h-7 w-7 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        aria-busy={isLoading}
        title={ariaLabel}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Spinner size="xs" variant={variant === 'primary' ? 'white' : 'current'} />
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
