import { useRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * options: [{ value, labelSm?, labelLg?, label?, disabled?, controlsId? }]
 * value:   current selected value
 * onChange(nextValue)
 */

const containerStyles = cva('inline-flex rounded-full border border-brand-border/60 bg-white', {
  variants: {
    size: { sm: 'p-0.5', md: 'p-1', lg: 'p-1.5' },
    fullWidth: { true: 'w-full', false: '' },
  },
  defaultVariants: { size: 'md', fullWidth: false },
});

const tabStyles = cva(
  'rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40',
  {
    variants: {
      size: {
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-sm',
      },
      fit: {
        equal: 'flex-1', // alla lika breda
        auto: '', // bredd enligt innehåll
      },
      state: {
        active: 'bg-brand-primary text-white shadow',
        inactive: 'text-gray-700 hover:bg-brand-surface-200',
        disabled: 'opacity-50 cursor-not-allowed',
      },
    },
    defaultVariants: { size: 'md', fit: 'equal', state: 'inactive' },
  }
);

export default function SegmentedControl({
  options = [],
  value,
  onChange = () => {},
  className,
  ariaLabel = 'Filtrera',
  size = 'md',
  fit = 'equal',
  fullWidth = false,
}) {
  const btnRefs = useRef([]);

  function findNextIndex(start, dir) {
    const len = options.length;
    let i = start;
    for (let step = 0; step < len; step++) {
      i = (i + dir + len) % len;
      if (!options[i]?.disabled) return i;
    }
    return start;
  }

  function onKeyDown(e, idx) {
    let nextIdx = null;
    if (e.key === 'ArrowRight') nextIdx = findNextIndex(idx, +1);
    else if (e.key === 'ArrowLeft') nextIdx = findNextIndex(idx, -1);
    else if (e.key === 'Home') nextIdx = findNextIndex(-1, +1);
    else if (e.key === 'End') nextIdx = findNextIndex(0, -1);
    if (nextIdx == null) return;

    e.preventDefault();
    const next = options[nextIdx];
    if (!next || next.disabled) return;
    onChange(next.value);
    // flytta fokus till nästa val direkt
    queueMicrotask(() => btnRefs.current[nextIdx]?.focus());
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(containerStyles({ size, fullWidth }), 'w-full max-w-md', className)}
    >
      {options.map((opt, idx) => {
        const active = opt.value === value;
        const sm = opt.labelSm ?? opt.label ?? '';
        const lg = opt.labelLg ?? opt.label ?? sm;

        const state = opt.disabled ? 'disabled' : active ? 'active' : 'inactive';

        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            ref={(el) => (btnRefs.current[idx] = el)}
            aria-selected={active}
            aria-controls={opt.controlsId}
            disabled={opt.disabled}
            tabIndex={active ? 0 : -1}
            onClick={() => !opt.disabled && onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            className={cn(tabStyles({ size, fit, state }))}
          >
            <span className="md:hidden">{sm}</span>
            <span className="hidden md:inline">{lg}</span>
          </button>
        );
      })}
    </div>
  );
}
