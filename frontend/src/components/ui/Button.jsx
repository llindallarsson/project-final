const base =
  "inline-flex items-center justify-center font-medium rounded-md transition-colors";
const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5",
};
const variants = {
  primary: "bg-vindra-600 text-white hover:bg-vindra-700",
  secondary: "bg-white text-gray-900 border hover:bg-gray-50",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
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
