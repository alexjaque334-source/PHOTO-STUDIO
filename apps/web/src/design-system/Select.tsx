import React, { forwardRef, useId } from 'react';
import { cn } from './cn';
import { ChevronDown } from 'lucide-react';
import { FormField, Label, HelperText, ErrorMessage } from './FormField';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      options,
      children,
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

    const selectElement = (
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            'flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-9 text-sm text-foreground shadow-xs transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40 cursor-pointer',
            error && 'border-destructive focus-visible:ring-destructive/80',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute right-3 pointer-events-none text-muted-foreground select-none">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    );

    if (!label && !helperText && !error) {
      return selectElement;
    }

    return (
      <FormField>
        {label && (
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
        )}
        {selectElement}
        {helperText && !error && <HelperText id={helperId}>{helperText}</HelperText>}
        {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
      </FormField>
    );
  }
);

Select.displayName = 'Select';
