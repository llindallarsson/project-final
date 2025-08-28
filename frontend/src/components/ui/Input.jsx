import { forwardRef, useId } from "react";

/**
 * Reusable input with label, hint and error support.
 * - Auto-generates an id if none is provided (useId).
 * - Exposes a ref to the <input> (forwardRef).
 * - Adds proper ARIA attributes for hint/error.
 * - Keeps styling consistent with the rest of the app.
 */
const Input = forwardRef(function Input(
  {
    label,
    id,
    hint,
    error, // string | boolean – when truthy shows error text and red styles
    required = false,
    className = "", // wrapper <div> classes
    inputClassName = "", // extra classes for the <input>
    labelClassName = "", // extra classes for the <label>
    ...props
  },
  ref
) {
  const uid = useId();
  const inputId = id || uid;
  const hasDesc = Boolean(hint) || Boolean(error);
  const descId = hasDesc ? `${inputId}-desc` : undefined;
  const invalid = Boolean(error);

  return (
    <div className={`grid gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className={labelClassName}>
          {label}
          {required && (
            <span className='text-red-600' aria-hidden>
              {" "}
              *
            </span>
          )}
        </label>
      )}

      <input
        id={inputId}
        ref={ref}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={descId}
        className={`border border-brand-border rounded-lg px-3 py-2 outline-none
                    focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                    placeholder:text-gray-400 disabled:opacity-60
                    ${invalid ? "border-red-500 focus:ring-red-200" : ""}
                    ${inputClassName}`}
        {...props}
      />

      {hasDesc && (
        <p
          id={descId}
          className={`text-xs ${invalid ? "text-red-600" : "text-gray-500"}`}
        >
          {invalid ? error : hint}
        </p>
      )}
    </div>
  );
});

export default Input;
