import { forwardRef } from "react";
import { Link } from "react-router-dom";

const base =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary disabled:opacity-60 disabled:pointer-events-none";
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
  outline:
    "bg-white text-gray-900 border border-brand-border hover:bg-brand-surface-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

function Spinner() {
  return (
    <span
      aria-hidden
      className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white'
    />
  );
}

/**
 * Reusable Button component.
 * - Supports sizes, variants, fullWidth, loading state, and optional icons.
 * - Can render as <button>, <a>, or <Link as={Link} to="/path">.
 */
const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      className = "",
      fullWidth = false,
      isLoading = false,
      leftIcon = null,
      rightIcon = null,
      as, // e.g. as={Link} to render a react-router Link
      to, // used when as={Link}
      href, // used when as="a"
      disabled,
      ...props
    },
    ref
  ) => {
    const cls = [
      base,
      sizes[size] || sizes.md,
      variants[variant] || variants.primary,
      fullWidth ? "w-full" : "",
      isLoading ? "cursor-wait" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const content = (
      <>
        {isLoading ? (
          <span className='mr-2'>
            <Spinner />
          </span>
        ) : leftIcon ? (
          <span className='mr-2 inline-flex'>{leftIcon}</span>
        ) : null}
        <span>{children}</span>
        {rightIcon ? (
          <span className='ml-2 inline-flex'>{rightIcon}</span>
        ) : null}
      </>
    );

    const shared = {
      ref,
      className: cls,
      "aria-busy": isLoading ? "true" : undefined,
      disabled: isLoading || disabled,
      ...props,
    };

    if (as === Link) {
      return (
        <Link to={to} {...shared}>
          {content}
        </Link>
      );
    }
    if (as === "a") {
      return (
        <a href={href} {...shared}>
          {content}
        </a>
      );
    }
    return <button {...shared}>{content}</button>;
  }
);

export default Button;
