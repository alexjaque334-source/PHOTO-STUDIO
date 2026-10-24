import React from 'react';
import { cn } from './cn';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className,
  ...props
}) => (
  <div className="relative w-full overflow-auto rounded-xl border border-border/80 bg-card">
    <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <thead
    className={cn('border-b border-border bg-secondary/50 text-muted-foreground text-xs uppercase font-semibold tracking-wider', className)}
    {...props}
  />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <tbody className={cn('[&_tr:last-child]:border-0 divide-y divide-border/60', className)} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  ...props
}) => (
  <tr
    className={cn(
      'transition-colors hover:bg-secondary/40 data-[state=selected]:bg-secondary/60',
      className
    )}
    {...props}
  />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <th
    className={cn(
      'h-10 px-4 text-left align-middle font-semibold text-muted-foreground [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <td
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0 text-foreground', className)}
    {...props}
  />
);

export const TableFooter: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <tfoot
    className={cn('border-t border-border bg-secondary/30 font-medium text-foreground', className)}
    {...props}
  />
);
