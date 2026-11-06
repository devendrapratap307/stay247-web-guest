import { z } from 'zod';
import { v } from '../../../utils/validation.utils';

export const emailSchema = z.object({ email: v.email });
export const otpSchema = z.object({ code: v.otp });
export const loginSchema = z.object({ email: v.email, password: z.string().min(1, 'Enter your password').max(128) });
export const signupSchema = z.object({
  name: v.name('Full name'),
  email: v.email,
  password: v.password,
  confirm: z.string().min(1, 'Confirm your password'),
}).refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });
export const resetSchema = z.object({ password: v.password, confirm: z.string().min(1, 'Confirm your password') })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export type EmailForm = z.infer<typeof emailSchema>;
export type OtpForm = z.infer<typeof otpSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
export type SignupForm = z.infer<typeof signupSchema>;
export type ResetForm = z.infer<typeof resetSchema>;
