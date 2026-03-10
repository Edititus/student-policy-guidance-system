/**
 * Zod Validation Schemas
 * Centralized form validation schemas
 */

import { z } from 'zod';

// ============================================
// Auth Schemas
// ============================================

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration form validation schema
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .transform((v) => v.trim()),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  schoolId: z.string().min(1, 'Please select a school'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Password change form validation schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/**
 * Profile update form validation schema
 */
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  matricNumber: z.string().optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// ============================================
// Chat Schemas
// ============================================

/**
 * Chat message validation schema
 */
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Please enter a message')
    .max(2000, 'Message must be less than 2000 characters'),
});

export type ChatMessageFormData = z.infer<typeof chatMessageSchema>;

// ============================================
// Admin Schemas
// ============================================

/**
 * Admin query response validation schema
 */
export const queryResponseSchema = z.object({
  response: z
    .string()
    .min(1, 'Please enter a response')
    .min(10, 'Response must be at least 10 characters')
    .max(5000, 'Response must be less than 5000 characters'),
});

export type QueryResponseFormData = z.infer<typeof queryResponseSchema>;

/**
 * Policy upload validation schema
 */
export const policyUploadSchema = z.object({
  title: z
    .string()
    .min(1, 'Policy title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  category: z
    .string()
    .min(1, 'Category is required'),
  institution: z
    .string()
    .min(1, 'Institution is required'),
  visibility: z.enum(['PUBLIC', 'SCHOOL_ONLY']).default('PUBLIC'),
});

export type PolicyUploadFormData = z.infer<typeof policyUploadSchema>;

/**
 * Date range filter validation schema
 */
export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['endDate'],
  }
);

export type DateRangeFormData = z.infer<typeof dateRangeSchema>;

// ============================================
// Utility Functions
// ============================================

/**
 * Extract field error messages from Zod validation result
 */
export function extractFieldErrors<T extends z.ZodType<any, any, any>>(
  schema: T,
  data: unknown
): Record<string, string> {
  const result = schema.safeParse(data);
  if (result.success) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path[0];
    if (typeof field === 'string' && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  });

  return fieldErrors;
}

/**
 * Validate a single field
 */
export function validateField<T extends z.ZodType<any, any, any>>(
  schema: T,
  field: keyof z.infer<T>,
  value: unknown,
  fullData?: Partial<z.infer<T>>
): string | undefined {
  try {
    // For fields that need full context (like confirmPassword), use full data
    if (fullData) {
      const result = schema.safeParse({ ...fullData, [field]: value });
      if (!result.success) {
        const fieldError = result.error.issues.find(
          (issue) => issue.path[0] === field
        );
        return fieldError?.message;
      }
    } else {
      // For simple single-field validation (works with ZodObject schemas)
      const shape = (schema as any).shape;
      if (shape) {
        const fieldSchema = shape[field as string] as z.ZodType | undefined;
        if (fieldSchema) {
          fieldSchema.parse(value);
        }
      }
    }
    return undefined;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message;
    }
    return 'Invalid value';
  }
}
