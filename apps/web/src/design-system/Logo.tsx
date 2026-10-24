import React from 'react';
import { cn } from './cn';

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className,
  ...props
}) => {
  const sizeMap = {
    sm: { height: 24, markWidth: 24, fullWidth: 160 },
    md: { height: 32, markWidth: 32, fullWidth: 210 },
    lg: { height: 42, markWidth: 42, fullWidth: 280 },
  };

  const currentSize = sizeMap[size];

  if (variant === 'mark') {
    return (
      <svg
        viewBox="0 0 40 40"
        width={currentSize.markWidth}
        height={currentSize.height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('shrink-0 select-none', className)}
        aria-label="ALEGON AI Photo Studio"
        role="img"
        {...props}
      >
        <defs>
          <linearGradient id="alegon-lens-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="50%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#3730A3" />
          </linearGradient>
          <linearGradient id="alegon-spark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Câmera / Moldura Externa de Precisão */}
        <rect
          x="3"
          y="3"
          width="34"
          height="34"
          rx="10"
          stroke="url(#alegon-lens-grad)"
          strokeWidth="2.5"
          className="transition-all duration-300"
        />

        {/* Lente Central Inteligente */}
        <circle cx="20" cy="20" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" className="text-muted-foreground" />
        <circle cx="20" cy="20" r="5.5" fill="url(#alegon-lens-grad)" />

        {/* Centelha / Brilho Criativo AI */}
        <path
          d="M27 8L28.2 11.8L32 13L28.2 14.2L27 18L25.8 14.2L22 13L25.8 11.8L27 8Z"
          fill="url(#alegon-spark-grad)"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 260 40"
      width={currentSize.fullWidth}
      height={currentSize.height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none', className)}
      aria-label="ALEGON AI Photo Studio"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id="alegon-lens-grad-full" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#3730A3" />
        </linearGradient>
        <linearGradient id="alegon-spark-grad-full" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Marca / Ícone */}
      <rect x="2" y="3" width="34" height="34" rx="10" stroke="url(#alegon-lens-grad-full)" strokeWidth="2.5" />
      <circle cx="19" cy="20" r="9" stroke="currentColor" strokeWidth="1.75" strokeDasharray="3 2" className="text-muted-foreground" />
      <circle cx="19" cy="20" r="5" fill="url(#alegon-lens-grad-full)" />
      <path
        d="M26 6L27 9.5L30.5 10.5L27 11.5L26 15L25 11.5L21.5 10.5L25 9.5L26 6Z"
        fill="url(#alegon-spark-grad-full)"
      />

      {/* Tipografia da Marca */}
      <text
        x="46"
        y="21"
        fill="currentColor"
        className="text-foreground font-black text-[17px] tracking-tight"
        style={{ letterSpacing: '0.08em' }}
      >
        ALEGON
      </text>

      {/* Badge de IA / Estúdio */}
      <rect x="135" y="10" width="22" height="13" rx="3.5" fill="#4F46E5" />
      <text x="140" y="20" fill="#FFFFFF" fontSize="9" fontWeight="700" letterSpacing="0.05em">
        AI
      </text>

      <text
        x="47"
        y="33"
        fill="currentColor"
        className="text-muted-foreground font-medium text-[9px] tracking-wider uppercase"
        style={{ letterSpacing: '0.14em' }}
      >
        Photo Studio
      </text>
    </svg>
  );
};
