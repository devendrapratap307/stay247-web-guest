import { useFormContext } from 'react-hook-form';
import { Input } from '../ui/Input';
import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> { name: string; label: string; hint?: string }

/** Input bound to the surrounding <FormProvider>; shows the validation message automatically. */
export function FormInput({ name, label, hint, ...rest }: Props) {
  const { register, formState: { errors } } = useFormContext();
  const err = errors[name]?.message as string | undefined;
  return <Input label={label} hint={hint} error={err} {...register(name)} {...rest} />;
}
