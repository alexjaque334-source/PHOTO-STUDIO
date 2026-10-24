import React, { forwardRef, useId } from 'react';
import { cn } from './cn';
import { FormField, Label, HelperText, ErrorMessage } from './FormField';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  maxCharacters?: number;
  showCharCount?: boolean;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      maxCharacters,
      showCharCount = false,
      required,
      id: customId,
      disabled,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;

    const [currentLength, setCurrentLength] = React.useState<number>(() => {
      if (typeof value === 'string') return value.length;
      if (typeof defaultValue === 'string') return defaultValue.length;
      return 0;
    });

    React.useEffect(() => {
      if (typeof value === 'string') {
        setCurrentLength(value.length);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCurrentLength(e.target.value.length);
      if (onChange) {
        onChange(e);
      }
    };

    const textareaElement = (
      <div className="relative w-full">
        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          maxLength={maxCharacters}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            'flex min-h-[90px] w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground/60 resize-y',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40 leading-relaxed',
            error && 'border-destructive focus-visible:ring-destructive/80',
            className
          )}
          {...props}
        />
        {showCharCount && maxCharacters && (
          <div
            className={cn(
              'mt-1 text-right text-[11px] font-mono select-none',
              currentLength > maxCharacters * 0.9
                ? 'text-warning font-semibold'
                : 'text-muted-foreground'
            )}
            aria-live="polite"
          >
            {currentLength}/{maxCharacters} caracteres
          </div>
        )}
      </div>
    );

    if (!label && !helperText && !error && !showCharCount) {
      return textareaElement;
    }

    return (
      <FormField>
        {label && (
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
        )}
        {textareaElement}
        {helperText && !error && <HelperText id={helperId}>{helperText}</HelperText>}
        {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
      </FormField>
    );
  }
);

Textarea.displayName = 'Textarea';
