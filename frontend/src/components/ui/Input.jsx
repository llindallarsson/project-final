import { cva } from 'class-variance-authority';
import { forwardRef, useId, useState } from 'react';

import { cn } from '../../lib/cn';

const inputStyles = cva(
  'block w-full rounded-lg border bg-white text-gray-900 placeholder:text-gray-400 ' +
    'shadow-sm transition focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-3',
        lg: 'h-11 px-4 text-lg',
      },
      variant: {
        default:
          'border-brand-border focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary',
        subtle:
          'border-brand-border/60 focus-visible:ring-2 focus-visible:ring-brand-primary/25 focus-visible:border-brand-primary/70',
        filled:
          'border-transparent bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary',
      },
      invalid: {
        true: 'border-red-500 focus-visible:ring-red-200 focus-visible:border-red-500',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      invalid: false,
    },
  }
);

/**
 * Input – återanvändbart textfält med label/hint/error (CVA).
 */
const Input = forwardRef(function Input(
  {
    label,
    id,
    hint,
    error, // string | boolean
    required = false,
    className = '', // wrapper <div>
    inputClassName = '', // extra klasser för <input>
    labelClassName = '', // extra klasser för <label>
    size = 'md',
    variant = 'default',
    leftIcon,
    rightIcon,
    ...props
  },
  ref
) {
  const uid = useId();
  const inputId = id || uid;

  const hasHint = Boolean(hint);
  const hasError = Boolean(error);
  const hintId = hasHint ? `${inputId}-hint` : undefined;
  const errorId = hasError ? `${inputId}-error` : undefined;
  const describedBy = cn(hintId, errorId);

  return (
    <div className={cn('grid gap-1.5', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn('text-sm font-medium text-gray-800', labelClassName)}
        >
          {label}
          {required && (
            <span className="text-red-600" aria-hidden>
              {' '}
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-gray-500">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          ref={ref}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            inputStyles({ size, variant, invalid: hasError }),
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            inputClassName
          )}
          {...props}
        />

        {rightIcon && (
          <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-gray-500">
            {rightIcon}
          </span>
        )}
      </div>

      {hasHint && !hasError && (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} className="text-xs text-red-600">
          {typeof error === 'string' ? error : 'Ogiltigt värde'}
        </p>
      )}
    </div>
  );
});

/**
 * PasswordInput – samma API som Input men med show/hide-toggle.
 */
export const PasswordInput = forwardRef(function PasswordInput(
  {
    label,
    id,
    hint,
    error,
    required = false,
    className = '',
    inputClassName = '',
    labelClassName = '',
    size = 'md',
    variant = 'default',
    leftIcon,
    showAriaLabel = { show: 'Visa lösenord', hide: 'Dölj lösenord' },
    autoComplete = 'current-password',
    ...props
  },
  ref
) {
  const uid = useId();
  const inputId = id || uid;
  const [show, setShow] = useState(false);

  const hasHint = Boolean(hint);
  const hasError = Boolean(error);
  const hintId = hasHint ? `${inputId}-hint` : undefined;
  const errorId = hasError ? `${inputId}-error` : undefined;
  const describedBy = cn(hintId, errorId);

  return (
    <div className={cn('grid gap-1.5', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn('text-sm font-medium text-gray-800', labelClassName)}
        >
          {label}
          {required && (
            <span className="text-red-600" aria-hidden>
              {' '}
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-gray-500">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          ref={ref}
          type={show ? 'text' : 'password'}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            inputStyles({ size, variant, invalid: hasError }),
            leftIcon && 'pl-10',
            'pr-10', // plats för toggle-knappen
            inputClassName
          )}
          {...props}
        />

        {/* Toggle-knapp (utan externa ikondeps) */}
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? showAriaLabel.hide : showAriaLabel.show}
          aria-pressed={show}
          className="absolute inset-y-0 right-1 grid place-items-center rounded-md px-2
                     text-gray-600 hover:text-gray-900 focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          {show ? (
            // eye-off
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.46-1.06 1.12-2.06 1.94-2.94" />
              <path d="M22.06 9.06A10.94 10.94 0 0 0 12 4c-1.61 0-3.14.3-4.55.84" />
              <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            // eye
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {hasHint && !hasError && (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} className="text-xs text-red-600">
          {typeof error === 'string' ? error : 'Ogiltigt värde'}
        </p>
      )}
    </div>
  );
});

export default Input;
