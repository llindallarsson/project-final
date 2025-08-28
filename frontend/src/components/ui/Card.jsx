import { forwardRef } from "react";

/** Small util to join class names safely */
function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Card
 * - Backward compatible: <Card><CardHeader/><CardContent/></Card> still works.
 * - New props:
 *    - as: element tag (default "section")
 *    - bordered: boolean (default true)
 *    - shadow: boolean (default true)
 *    - variant: "elevated" | "flat" (default "elevated")
 */
export const Card = forwardRef(function Card(
  {
    as: Tag = "section",
    bordered = true,
    shadow = true,
    variant = "elevated",
    className = "",
    children,
    ...rest
  },
  ref
) {
  return (
    <Tag
      ref={ref}
      className={cx(
        "bg-white rounded-2xl",
        bordered && "border border-brand-border/30",
        shadow && (variant === "elevated" ? "shadow-soft" : "shadow-none"),
        // keep compatibility with any existing shadow utility in your CSS
        "shadow-card",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
});

/**
 * CardHeader
 * - Backward compatible: children rendering remains unchanged.
 * - New props:
 *    - title / subtitle: quick way to render a standard header
 *    - actions: right-side node (e.g. buttons)
 *    - divider: boolean (default true)
 *    - padding: "sm" | "md" | "lg" (default "md")
 *    - as: element tag (default "div")
 */
export function CardHeader({
  as: Tag = "div",
  title,
  subtitle,
  actions,
  divider = true,
  padding = "md",
  className = "",
  children,
}) {
  const pad =
    padding === "sm" ? "p-3" : padding === "lg" ? "p-6" : /* md */ "p-4";

  return (
    <Tag
      className={cx(
        pad,
        divider && "border-b border-brand-border/30",
        className
      )}
    >
      {children ? (
        children
      ) : (
        <div className='flex items-start justify-between gap-3'>
          <div>
            {title && (
              <h3 className='text-lg font-semibold leading-tight'>{title}</h3>
            )}
            {subtitle && (
              <p className='text-sm text-gray-600 mt-0.5'>{subtitle}</p>
            )}
          </div>
          {actions && <div className='shrink-0'>{actions}</div>}
        </div>
      )}
    </Tag>
  );
}

/**
 * CardContent
 * - Backward compatible.
 * - New props:
 *    - padding: "sm" | "md" | "lg" (default "md")
 *    - as: element tag (default "div")
 */
export function CardContent({
  as: Tag = "div",
  padding = "md",
  className = "",
  children,
}) {
  const pad =
    padding === "sm" ? "p-3" : padding === "lg" ? "p-6" : /* md */ "p-4";

  return <Tag className={cx(pad, className)}>{children}</Tag>;
}

/**
 * CardFooter (new)
 * - Optional footer with a top divider.
 * - API mirrors CardHeader for consistency.
 */
export function CardFooter({
  as: Tag = "div",
  padding = "md",
  divider = true,
  className = "",
  children,
}) {
  const pad =
    padding === "sm" ? "p-3" : padding === "lg" ? "p-6" : /* md */ "p-4";
  return (
    <Tag
      className={cx(
        pad,
        divider && "border-t border-brand-border/30",
        className
      )}
    >
      {children}
    </Tag>
  );
}
