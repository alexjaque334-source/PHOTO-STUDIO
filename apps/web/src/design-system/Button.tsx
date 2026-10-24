import React, { forwardRef } from 'react';
import { cn } from './cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      fullWidth = false,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer';

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow active:bg-primary/90',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60',
      outline:
        'bg-transparent border border-border text-foreground hover:bg-secondary/60 hover:border-foreground/30',
      ghost:
        'bg-transparent text-foreground hover:bg-secondary/70 active:bg-secondary',
      danger:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm focus-visible:ring-destructive',
      gold:
        'bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 shadow-sm active:bg-amber-600 focus-visible:ring-amber-500',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner
              size={size === 'sm' ? 'xs' : 'sm'}
              variant={variant === 'primary' || variant === 'danger' ? 'white' : 'current'}
            />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
