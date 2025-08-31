import { cva } from 'class-variance-authority';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

import { cn } from '../../lib/cn';

export const buttonStyles = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary ' +
    'disabled:opacity-60 disabled:pointer-events-none',

  {
    variants: {
      variant: {
        primary: 'bg-brand-primary text-white hover:bg-brand-primary-600',
        secondary: 'bg-brand-secondary text-white hover:bg-brand-secondary-600',
        accent: 'bg-brand-accent text-white hover:bg-brand-accent-600',
        ghost: 'bg-transparent text-brand-primary hover:bg-brand-surface-200',
        outline: 'bg-white text-gray-900 border border-brand-border hover:bg-brand-surface-100',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5',
        icon: 'h-10 w-10 p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      loading: {
        true: 'cursor-wait',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      loading: false,
    },
  }
);

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white"
    />
  );
}

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon = null,
      rightIcon = null,
      as, // Link | "a"
      to, // används när as===Link
      href, // används när as==="a"
      className,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled || isLoading);

    const classes = cn(
      buttonStyles({ variant, size, fullWidth, loading: isLoading }),
      (as === Link || as === 'a') && isDisabled && 'pointer-events-none opacity-60',
      className
    );

    const content = (
      <>
        {isLoading ? (
          <span className="mr-2">
            <Spinner />
          </span>
        ) : leftIcon ? (
          <span className="mr-2 inline-flex">{leftIcon}</span>
        ) : null}
        <span>{children}</span>
        {rightIcon ? <span className="ml-2 inline-flex">{rightIcon}</span> : null}
      </>
    );

    const shared = {
      ref,
      className: classes,
      'aria-busy': isLoading || undefined,
      'data-disabled': isDisabled ? 'true' : undefined,
      ...props,
    };

    if (as === Link) {
      return (
        <Link
          to={to}
          aria-disabled={isDisabled || undefined}
          tabIndex={isDisabled ? -1 : undefined}
          {...shared}
        >
          {content}
        </Link>
      );
    }

    if (as === 'a') {
      return (
        <a
          href={href}
          aria-disabled={isDisabled || undefined}
          tabIndex={isDisabled ? -1 : undefined}
          {...shared}
        >
          {content}
        </a>
      );
    }

    return (
      <button type={type} disabled={isDisabled} {...shared}>
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
