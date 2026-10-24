import React, { forwardRef, useId } from 'react';
import { cn } from './cn';
import { FormField, Label, HelperText, ErrorMessage } from './FormField';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      required,
      id: customId,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;

    const inputElement = (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground select-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            'flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground/60',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            error && 'border-destructive focus-visible:ring-destructive/80',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 flex items-center text-muted-foreground select-none">
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (!label && !helperText && !error) {
      return inputElement;
    }

    return (
      <FormField>
        {label && (
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
        )}
        {inputElement}
        {helperText && !error && <HelperText id={helperId}>{helperText}</HelperText>}
        {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
      </FormField>
    );
  }
);

Input.displayName = 'Input';
