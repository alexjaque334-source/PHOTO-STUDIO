import React from 'react';
import { cn } from './cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'interactive' | 'gold';
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-card text-card-foreground border border-border/80 shadow-xs',
    flat: 'bg-secondary/40 text-foreground border border-border/50',
    interactive:
      'bg-card text-card-foreground border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer',
    gold: 'bg-card text-card-foreground border border-amber-500/40 shadow-xs shadow-amber-500/5',
  };

  return (
    <div
      className={cn('rounded-xl overflow-hidden', variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={cn('text-lg font-bold tracking-tight text-foreground', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p className={cn('text-sm text-muted-foreground leading-relaxed', className)} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('p-6 pt-0', className)} {...props} />;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn('flex items-center justify-between p-6 pt-0 border-t border-border/40 mt-4', className)}
    {...props}
  />
);
