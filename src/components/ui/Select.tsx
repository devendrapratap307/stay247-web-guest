import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import type { Option } from '../../types/common.types';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> { label: string; options: Option[]; error?: string; placeholder?: string }

export const Select = forwardRef<HTMLSelectElement, Props>(function Select({ label, options, error, placeholder, id, ...rest }, ref) {
  const auto = useId();
  const sid = id ?? auto;
  return (
    <label className="field" htmlFor={sid}>
      <span>{label}</span>
      <select ref={ref} id={sid} className="input" aria-invalid={!!error} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <div role="alert" className="field-error">{error}</div>}
    </label>
  );
});
