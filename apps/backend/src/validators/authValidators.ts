import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and a number'
    ),
  name: z.string().min(1).max(100).transform((v) => v.trim()),
  schoolId: z.string().min(1, 'School selection is required'),
  department: z.string().optional(),
  studentId: z.string().optional(),
  year: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});
