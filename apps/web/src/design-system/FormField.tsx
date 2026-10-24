import React from 'react';
import { cn } from './cn';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ children, className }) => {
  return <div className={cn('flex flex-col gap-1.5', className)}>{children}</div>;
};

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({
  children,
  className,
  required,
  ...props
}) => {
  return (
    <label
      className={cn(
        'text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 select-none',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {required && (
        <span className="text-destructive font-bold text-sm" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
};

export interface HelperTextProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const HelperText: React.FC<HelperTextProps> = ({ children, className, id }) => {
  return (
    <p id={id} className={cn('text-xs text-muted-foreground leading-normal', className)}>
      {children}
    </p>
  );
};

export interface ErrorMessageProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ children, className, id }) => {
  if (!children) return null;

  return (
    <p
      id={id}
      role="alert"
      className={cn(
        'text-xs text-destructive flex items-center gap-1.5 font-medium leading-normal animate-in fade-in duration-150',
        className
      )}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
};
