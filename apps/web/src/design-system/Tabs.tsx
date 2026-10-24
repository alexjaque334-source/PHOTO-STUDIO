import React, { createContext, useContext, useId } from 'react';
import { cn } from './cn';

interface TabsContextType {
  value: string;
  onChange: (value: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onChange, children, className }) => {
  const baseId = useId();
  return (
    <TabsContext.Provider value={{ value, onChange, baseId }}>
      <div className={cn('flex flex-col gap-4', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export interface TabListProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export const TabList: React.FC<TabListProps> = ({
  children,
  className,
  'aria-label': ariaLabel = 'Seções de navegação',
}) => {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-secondary rounded-xl border border-border/80 text-muted-foreground overflow-x-auto max-w-full',
        className
      )}
    >
      {children}
    </div>
  );
};

export interface TabTriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const TabTrigger: React.FC<TabTriggerProps> = ({
  value,
  children,
  icon,
  disabled = false,
  className,
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabTrigger deve estar dentro de Tabs');

  const { value: selectedValue, onChange, baseId } = context;
  const isSelected = selectedValue === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <button
      id={tabId}
      role="tab"
      type="button"
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={() => onChange(value)}
      className={cn(
        'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 select-none cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        isSelected
          ? 'bg-card text-foreground shadow-xs'
          : 'hover:text-foreground hover:bg-card/40',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="h-3.5 w-3.5 shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export interface TabContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabContent: React.FC<TabContentProps> = ({ value, children, className }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabContent deve estar dentro de Tabs');

  const { value: selectedValue, baseId } = context;
  const isSelected = selectedValue === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  if (!isSelected) return null;

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      tabIndex={0}
      className={cn('focus-visible:outline-none animate-in fade-in duration-150', className)}
    >
      {children}
    </div>
  );
};
