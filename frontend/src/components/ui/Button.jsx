const base =
  "inline-flex items-center justify-center font-medium rounded-md transition-colors";
const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5",
};
const variants = {
  primary: "bg-brand-primary text-white hover:bg-brand-primary-600",
  secondary: "bg-brand-secondary text-white hover:bg-brand-secondary-600",
  accent: "bg-brand-accent text-white hover:bg-brand-accent-600",
  ghost: "bg-transparent text-brand-primary hover:bg-brand-surface-200",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
