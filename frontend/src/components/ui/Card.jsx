import { cva } from 'class-variance-authority';
import { forwardRef } from 'react';

import { cn } from '../../lib/cn';

export const cardStyles = cva('bg-white text-gray-900 rounded-xl', {
  variants: {
    variant: {
      elevated: 'border border-brand-border/30 shadow-soft',
      outline: 'border border-brand-border/40 shadow-none',
      flat: 'border border-transparent shadow-none',
      ghost: 'border border-brand-border/20 bg-white/60 backdrop-blur shadow-none',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
    radius: {
      md: 'rounded-lg',
      lg: 'rounded-xl',
      xl: 'rounded-2xl',
    },
    interactive: {
      true: 'transition hover:shadow-lg hover:border-brand-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'elevated',
    padding: 'md',
    radius: 'xl',
    interactive: false,
  },
});

export const Card = forwardRef(function Card(
  {
    as: Tag = 'section',
    variant = 'elevated',
    padding = 'md',
    radius = 'xl',
    interactive = false,
    bordered = true, // BC: sätt false för att ta bort border
    shadow = undefined, // BC: om false → shadow-none
    className,
    children,
    ...rest
  },
  ref
) {
  const classes = cn(
    cardStyles({ variant, padding, radius, interactive }),
    bordered === false && 'border-0',
    shadow === false && 'shadow-none',
    className
  );

  return (
    <Tag ref={ref} className={classes} {...rest}>
      {children}
    </Tag>
  );
});

// --- Subkomponenter -------------------------------------------------------

const headerStyles = cva('', {
  variants: {
    padding: { sm: 'p-3', md: 'p-4', lg: 'p-6' },
    divider: { true: 'border-b border-brand-border/30', false: '' },
  },
  defaultVariants: { padding: 'md', divider: true },
});

export function CardHeader({
  as: Tag = 'div',
  title,
  subtitle,
  actions,
  divider = true,
  padding = 'md',
  className,
  children,
}) {
  const classes = cn(headerStyles({ padding, divider }), className);

  return (
    <Tag className={classes}>
      {children ? (
        children
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-lg font-semibold leading-tight">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
    </Tag>
  );
}

const contentStyles = cva('', {
  variants: { padding: { sm: 'p-3', md: 'p-4', lg: 'p-6' } },
  defaultVariants: { padding: 'md' },
});

export function CardContent({ as: Tag = 'div', padding = 'md', className, children }) {
  return <Tag className={cn(contentStyles({ padding }), className)}>{children}</Tag>;
}

const footerStyles = cva('', {
  variants: {
    padding: { sm: 'p-3', md: 'p-4', lg: 'p-6' },
    divider: { true: 'border-t border-brand-border/30', false: '' },
  },
  defaultVariants: { padding: 'md', divider: true },
});

export function CardFooter({
  as: Tag = 'div',
  padding = 'md',
  divider = true,
  className,
  children,
}) {
  return <Tag className={cn(footerStyles({ padding, divider }), className)}>{children}</Tag>;
}

// (Valfritt) Små hjälpare för semantiska element
export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-base font-semibold leading-6', className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-gray-600', className)} {...props} />;
}
