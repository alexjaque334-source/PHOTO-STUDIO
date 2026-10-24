import React from 'react';
import { cn } from './cn';

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'current' | 'white' | 'gold';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'current',
  className,
  label = 'Carregando...',
  ...props
}) => {
  const sizeMap = {
    xs: 'h-3.5 w-3.5',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
    xl: 'h-10 w-10',
  };

  const variantMap = {
    primary: 'text-primary',
    current: 'text-current',
    white: 'text-white',
    gold: 'text-amber-500',
  };

  return (
    <svg
      className={cn('animate-spin', sizeMap[size], variantMap[variant], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label={label}
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};
