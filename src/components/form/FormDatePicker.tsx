import { useFormContext } from 'react-hook-form';
import { Input } from '../ui/Input';

/** Date-time picker (native, accessible on mobile). The form value is the raw local string; convert with localInputToIso on submit. */
export function FormDatePicker({ name, label, min }: { name: string; label: string; min?: string }) {
  const { register, formState: { errors } } = useFormContext();
  return <Input type="datetime-local" label={label} min={min} error={errors[name]?.message as string | undefined} {...register(name)} />;
}
