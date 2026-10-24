import React, { useState } from 'react';
import { cn } from './cn';
import { User } from 'lucide-react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar do usuário',
  name,
  size = 'md',
  className,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (text?: string): string => {
    if (!text) return '';
    const parts = text.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeStyles = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden bg-secondary border border-border select-none shrink-0 font-semibold text-foreground',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
        />
      ) : initials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <User className="h-1/2 w-1/2 opacity-70" aria-hidden="true" />
      )}
    </div>
  );
};
