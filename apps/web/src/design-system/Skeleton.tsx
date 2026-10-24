import React from 'react';
import { cn } from './cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full shrink-0',
    rectangular: 'rounded-lg',
    card: 'h-44 w-full rounded-xl',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-muted/60 dark:bg-muted/40',
        variantStyles[variant],
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
};
