import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from './cn';
import { GripVertical } from 'lucide-react';

export interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt?: string;
  afterAlt?: string;
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number; // 0 a 100
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeAlt = 'Foto Original (Antes)',
  afterAlt = 'Foto Editada com IA (Depois)',
  beforeLabel = 'Antes (Original)',
  afterLabel = 'Depois (IA)',
  initialPosition = 50,
  className,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(initialPosition);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    calculatePosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    calculatePosition(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      calculatePosition(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      calculatePosition(e.touches[0].clientX);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, calculatePosition]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 5;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPosition((prev) => Math.max(0, prev - step));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPosition((prev) => Math.min(100, prev + step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSliderPosition(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSliderPosition(100);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label="Comparador interativo Antes e Depois da imagem"
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-2xl select-none cursor-ew-resize border border-border shadow-lg bg-black/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
    >
      {/* Imagem "Depois" (Fundo Base) */}
      <img
        src={afterImage}
        alt={afterAlt}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        draggable={false}
      />

      {/* Badge "Depois" */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-white/10 shadow-sm">
          {afterLabel}
        </span>
      </div>

      {/* Imagem "Antes" (Sobreposta com recorte dinâmico via clip-path) */}
      <div
        className="absolute inset-0 h-full w-full pointer-events-none overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeAlt}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          draggable={false}
        />
        {/* Badge "Antes" */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-white/10 shadow-sm">
            {beforeLabel}
          </span>
        </div>
      </div>

      {/* Linha Divisória e Alça de Controle */}
      <div
        className="absolute top-0 bottom-0 z-20 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Linha vertical */}
        <div className="absolute inset-y-0 -left-[1px] w-[2px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]" />

        {/* Alça centralizada */}
        <div className="absolute top-1/2 -left-4 -translate-y-1/2 h-8 w-8 rounded-full bg-white text-slate-900 shadow-xl border border-slate-300 flex items-center justify-center transform active:scale-95 transition-transform">
          <GripVertical className="h-4 w-4 opacity-80" />
        </div>
      </div>
    </div>
  );
};
