import { forwardRef } from 'react';

import { cn } from '../../lib/cn';
import Button from './Button';

const ButtonIcon = forwardRef(
  ({ className, variant = 'primary', size = 'icon', ...props }, ref) => {
    if (!props['aria-label'] && process.env.NODE_ENV !== 'production') {
      console.warn('IconButton: lägg till `aria-label` för tillgänglighet.');
    }
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn('rounded-full', className)}
        {...props}
      />
    );
  }
);

export default ButtonIcon;
