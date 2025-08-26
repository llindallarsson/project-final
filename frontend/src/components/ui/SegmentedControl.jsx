export default function SegmentedControl({
  options = [], // [{ value: 'week', label: 'V' }, ...]
  value,
  onChange,
  className = "",
}) {
  return (
    <div
      role='tablist'
      aria-label='Filtrera resor'
      className={`inline-flex w-full max-w-md rounded-full border border-brand-border/60 bg-white p-1 ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const sm = opt.labelSm ?? opt.label ?? ""; // bakåtkompatibelt
        const lg = opt.labelLg ?? opt.label ?? sm;

        return (
          <button
            key={opt.value}
            role='tab'
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40
              ${
                active
                  ? "bg-brand-primary text-white shadow"
                  : "text-gray-700 hover:bg-brand-surface-200"
              }`}
          >
            {/* Mobil: kort label, Desktop: lång label */}
            <span className='md:hidden'>{sm}</span>
            <span className='hidden md:inline'>{lg}</span>
          </button>
        );
      })}
    </div>
  );
}
