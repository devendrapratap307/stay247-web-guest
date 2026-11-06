import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> { label: string; error?: string; hint?: string }

export const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, error, hint, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <label className="field" htmlFor={inputId}>
      <span>{label}</span>
      <input ref={ref} id={inputId} className="input" aria-invalid={!!error} aria-describedby={error ? `${inputId}-e` : undefined} {...rest} />
      {hint && !error && <small className="muted">{hint}</small>}
      {error && <div id={`${inputId}-e`} role="alert" className="field-error">{error}</div>}
    </label>
  );
});
