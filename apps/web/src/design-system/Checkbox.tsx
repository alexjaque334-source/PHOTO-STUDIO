import React, { forwardRef, useId } from 'react';
import { cn } from './cn';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      error,
      id: customId,
      disabled,
      checked,
      defaultChecked,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const descId = `${id}-desc`;
    const errorId = `${id}-error`;

    const [isChecked, setIsChecked] = React.useState<boolean>(
      Boolean(checked ?? defaultChecked ?? false)
    );

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(Boolean(checked));
      }
    }, [checked]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (checked === undefined) {
        setIsChecked(e.target.checked);
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className={cn('flex items-start gap-3 select-none', className)}>
        <div className="relative flex items-center justify-center mt-0.5 shrink-0">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            disabled={disabled}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={handleChange}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : description ? descId : undefined}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
            {...props}
          />
          <div
            className={cn(
              'h-4.5 w-4.5 rounded-md border transition-all duration-150 flex items-center justify-center pointer-events-none',
              isChecked
                ? 'bg-primary border-primary text-primary-foreground shadow-xs'
                : 'border-border bg-card hover:border-primary/60',
              disabled && 'cursor-not-allowed opacity-50 bg-muted',
              error && 'border-destructive'
            )}
          >
            {isChecked && (
              <Check className="h-3.5 w-3.5 stroke-[3] text-primary-foreground stroke-current" />
            )}
          </div>
        </div>

        {(label || description || error) && (
          <div className="flex flex-col gap-0.5 leading-snug">
            {label && (
              <label
                htmlFor={id}
                className={cn(
                  'text-sm font-medium text-foreground cursor-pointer',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <span id={descId} className="text-xs text-muted-foreground">
                {description}
              </span>
            )}
            {error && (
              <span id={errorId} role="alert" className="text-xs text-destructive font-medium">
                {error}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
