export default function Spinner({
  label = "Laddar…", // visible or screen-reader label
  size = "md", // 'sm' | 'md' | 'lg' | number (px)
  tone = "default", // 'default' (dark on light) | 'inverse' (light on dark)
  fullScreen = false, // show centered overlay
  srOnlyLabel = false, // hide label visually but keep for screen readers
  className = "", // extra classes for the container
}) {
  // Resolve pixel size (allows custom number too)
  const sizePx =
    typeof size === "number" ? size : { sm: 16, md: 20, lg: 28 }[size] ?? 20;

  // Slightly thicker ring for larger sizes for visual balance
  const borderWidth = sizePx >= 24 ? 3 : 2;

  // Colors based on tone
  const textTone = tone === "inverse" ? "text-white/90" : "text-gray-600";
  const ringBase =
    tone === "inverse"
      ? "border-white/30 border-t-white"
      : "border-gray-300 border-t-gray-600";

  const containerCls = `flex items-center gap-2 ${textTone} ${className}`;
  const spinnerStyle = { width: sizePx, height: sizePx, borderWidth };

  const labelEl = label && (
    <span className={srOnlyLabel ? "sr-only" : "text-sm"}>{label}</span>
  );

  const content = (
    <div
      role='status'
      aria-live='polite'
      aria-busy='true'
      className={containerCls}
    >
      <span
        className={`inline-block animate-spin rounded-full border-2 ${ringBase}`}
        style={spinnerStyle}
      />
      {labelEl}
    </div>
  );

  if (!fullScreen) return content;

  // Fullscreen overlay (subtle backdrop, centered)
  return (
    <div className='fixed inset-0 z-[2000] grid place-items-center bg-black/10'>
      {content}
    </div>
  );
}
