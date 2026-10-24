import React from 'react';
import { cn } from './cn';
import { Card } from './Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  variant?: 'default' | 'gold';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  variant = 'default',
  className,
}) => {
  return (
    <Card
      variant={variant === 'gold' ? 'gold' : 'default'}
      className={cn('p-5 flex flex-col justify-between gap-4', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div
            className={cn(
              'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs',
              variant === 'gold'
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-secondary text-foreground'
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-black text-foreground tracking-tight font-mono">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center font-semibold',
                  trend.isPositive ? 'text-emerald-500' : 'text-destructive'
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {Math.abs(trend.value)}%
              </span>
            )}
            {trend?.label && <span>{trend.label}</span>}
            {!trend && description && <span>{description}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};
