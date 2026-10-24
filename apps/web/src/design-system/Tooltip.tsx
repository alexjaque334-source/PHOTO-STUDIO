import React, { useState, useId } from 'react';
import { cn } from './cn';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
  delay = 200,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);
  const tooltipId = useId();

  const handleMouseEnter = () => {
    const id = window.setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {React.cloneElement(children, {
        'aria-describedby': isVisible ? tooltipId : undefined,
      })}

      {isVisible && content && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute z-50 pointer-events-none whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900 px-2.5 py-1 text-[11px] font-medium shadow-md animate-in fade-in zoom-in-95 duration-150',
            positionStyles[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};
