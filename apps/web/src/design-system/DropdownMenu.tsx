import React, { useState, useRef, useEffect } from 'react';
import { cn } from './cn';

export interface DropdownMenuItemProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  onClick,
  icon,
  children,
  danger = false,
  disabled = false,
  className,
}) => {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-md text-left transition-colors select-none cursor-pointer',
        'hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none',
        danger
          ? 'text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10'
          : 'text-foreground',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {icon && <span className="h-3.5 w-3.5 shrink-0 opacity-80">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
};

export const DropdownMenuSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('h-px bg-border/60 my-1', className)} role="separator" />
);

export interface DropdownMenuProps {
  trigger: React.ReactElement;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  children,
  align = 'right',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div ref={menuRef} className="relative inline-flex">
      {React.cloneElement(trigger, {
        onClick: (e: React.MouseEvent) => {
          trigger.props.onClick?.(e);
          toggle();
        },
        'aria-expanded': isOpen,
        'aria-haspopup': 'true',
      })}

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute top-full mt-1.5 z-50 min-w-[180px] p-1 rounded-xl bg-popover border border-border text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-150',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};
