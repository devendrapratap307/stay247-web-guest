import { useFormContext } from 'react-hook-form';
import type { Option } from '../../types/common.types';
import { Select } from '../ui/Select';

export function FormSelect({ name, label, options, placeholder }: { name: string; label: string; options: Option[]; placeholder?: string }) {
  const { register, formState: { errors } } = useFormContext();
  return <Select label={label} options={options} placeholder={placeholder} error={errors[name]?.message as string | undefined} {...register(name)} />;
}
