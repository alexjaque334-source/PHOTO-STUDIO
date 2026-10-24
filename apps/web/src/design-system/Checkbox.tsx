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
        <div className="relative flex items-center justify-center mt-0.5">
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
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'h-4 w-4 rounded border border-border bg-card transition-all duration-150 flex items-center justify-center',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
              'peer-checked:bg-primary peer-checked:border-primary peer-checked:text-primary-foreground',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-disabled:bg-muted',
              error && 'border-destructive'
            )}
          >
            <Check
              className={cn(
                'h-3 w-3 stroke-[3] transition-transform duration-100',
                isChecked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              )}
            />
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
