import { z } from 'zod';

// Reusable zod building blocks so every form validates and words errors the same way.
export const v = {
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address').max(254),
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  name: (label = 'Name', min = 2, max = 120) =>
    z.string().trim().min(1, `${label} is required`).min(min, `${label} must be at least ${min} characters`).max(max, `${label} is too long`),
  money: z.coerce.number({ invalid_type_error: 'Enter an amount' }).min(0, 'Cannot be negative').max(10_000_000, 'Amount is too large'),
  qty: z.coerce.number({ invalid_type_error: 'Enter a quantity' }).gt(0, 'Must be greater than 0').max(10_000, 'Too large'),
  phoneIN: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  dateTime: z.string().min(1, 'Choose date and time'),
  password: z.string().min(8, 'At least 8 characters').max(128, 'Too long').regex(/\d/, 'Add at least one number').regex(/[^A-Za-z0-9]/, 'Add at least one symbol'),
  phoneOptional: z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').or(z.literal('')),
};
