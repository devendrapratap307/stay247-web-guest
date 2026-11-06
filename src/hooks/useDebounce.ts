import { useEffect, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../config/constants';

export function useDebounce<T>(value: T, ms = SEARCH_DEBOUNCE_MS): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
