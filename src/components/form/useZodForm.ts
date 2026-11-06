import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues, type FieldValues, type UseFormReturn } from 'react-hook-form';
import type { ZodType } from 'zod';
import { ApiError } from '../../services/api-error';

export function useZodForm<T extends FieldValues>(schema: ZodType<T, any, any>, defaults?: DefaultValues<T>): UseFormReturn<T> {
  return useForm<T>({ resolver: zodResolver(schema) as never, defaultValues: defaults, mode: 'onTouched' });
}

/** Maps a backend 422 `fields` object onto the matching form inputs. Returns true if it handled the error. */
export function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, e: unknown): boolean {
  if (!(e instanceof ApiError) || !e.fields) return false;
  Object.entries(e.fields).forEach(([name, message]) => form.setError(name as never, { type: 'server', message }));
  return true;
}
