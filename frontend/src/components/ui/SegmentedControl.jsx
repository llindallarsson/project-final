export default function SegmentedControl({
  options = [], // [{ value, labelSm?, labelLg?, label?, disabled?, controlsId? }]
  value,
  onChange = () => {},
  className = "",
  ariaLabel = "Filtrera",
}) {
  function onKeyDown(e, idx) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const len = options.length;
    let i = idx;
    // hoppa till nästa icke-disabled
    for (let step = 0; step < len; step++) {
      i = (i + dir + len) % len;
      if (!options[i]?.disabled) break;
    }
    const next = options[i];
    if (next && !next.disabled) onChange(next.value);
  }

  return (
    <div
      role='tablist'
      aria-label={ariaLabel}
      className={`inline-flex w-full max-w-md rounded-full border border-brand-border/60 bg-white p-1 ${className}`}
    >
      {options.map((opt, idx) => {
        const active = opt.value === value;
        const sm = opt.labelSm ?? opt.label ?? "";
        const lg = opt.labelLg ?? opt.label ?? sm;

        return (
          <button
            key={opt.value}
            type='button'
            role='tab'
            aria-selected={active}
            aria-controls={opt.controlsId}
            disabled={opt.disabled}
            tabIndex={active ? 0 : -1}
            onClick={() => !opt.disabled && onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40
              ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""}
              ${
                active
                  ? "bg-brand-primary text-white shadow"
                  : "text-gray-700 hover:bg-brand-surface-200"
              }`}
          >
            <span className='md:hidden'>{sm}</span>
            <span className='hidden md:inline'>{lg}</span>
          </button>
        );
      })}
    </div>
  );
}
