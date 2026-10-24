import React, { forwardRef, useId } from 'react';
import { cn } from './cn';

export interface SwitchProps {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  name?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      id: customId,
      checked: controlledChecked,
      defaultChecked = false,
      onChange,
      disabled = false,
      label,
      description,
      className,
      name,
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const descId = `${id}-desc`;

    const [uncontrolledChecked, setUncontrolledChecked] = React.useState<boolean>(defaultChecked);
    const isChecked = controlledChecked !== undefined ? controlledChecked : uncontrolledChecked;

    const toggle = () => {
      if (disabled) return;
      const next = !isChecked;
      if (controlledChecked === undefined) {
        setUncontrolledChecked(next);
      }
      onChange?.(next);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggle();
      }
    };

    return (
      <div className={cn('flex items-start gap-3 select-none', className)}>
        <button
          ref={ref}
          id={id}
          type="button"
          role="switch"
          name={name}
          aria-checked={isChecked}
          aria-describedby={description ? descId : undefined}
          disabled={disabled}
          onClick={toggle}
          onKeyDown={handleKeyDown}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isChecked ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out',
              isChecked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>

        {(label || description) && (
          <div className="flex flex-col gap-0.5 leading-snug">
            {label && (
              <label
                htmlFor={id}
                onClick={toggle}
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
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
