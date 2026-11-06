import type { ButtonHTMLAttributes } from 'react';
import { clsx } from '../../utils/format.utils';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, className, children, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx('btn', variant !== 'primary' && variant, size === 'sm' && 'sm', className)}
    >
      {loading && <span className="spinner" style={{ width: 14, height: 14, margin: 0, borderWidth: 2 }} aria-hidden />}
      {children}
    </button>
  );
}
