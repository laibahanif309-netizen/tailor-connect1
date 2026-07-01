import { z } from 'zod';

/**
 * Email validation regex pattern
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .min(1, 'Email cannot be empty')
    .trim()
    .email('Please enter a valid email address')
    .refine((val) => emailRegex.test(val), {
      message: 'Invalid email format',
    }),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(1, 'Password cannot be empty')
    .min(6, 'Password must be at least 6 characters long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Username validation rules
 */
const usernameValidation = z
  .string({
    required_error: 'Username is required',
  })
  .min(1, 'Username cannot be empty')
  .min(3, 'Username must be at least 3 characters long')
  .max(30, 'Username cannot exceed 30 characters')
  .trim()
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

/**
 * Password validation rules
 */
const passwordValidation = z
  .string({
    required_error: 'Password is required',
  })
  .min(1, 'Password cannot be empty')
  .min(6, 'Password must be at least 6 characters long')
  .max(100, 'Password cannot exceed 100 characters');

/**
 * Register form validation schema
 */
export const registerSchema = z
  .object({
    userType: z.enum(['customer', 'tailor'], {
      required_error: 'Please select a user type',
      invalid_type_error: 'Invalid user type selected',
    }),
    username: usernameValidation,
    email: z
      .string({
        required_error: 'Email is required',
      })
      .min(1, 'Email cannot be empty')
      .trim()
      .email('Please enter a valid email address')
      .refine((val) => emailRegex.test(val), {
        message: 'Invalid email format',
      })
      .transform((val) => val.toLowerCase()),
    password: passwordValidation,
    confirmPassword: z
      .string({
        required_error: 'Please confirm your password',
      })
      .min(1, 'Password confirmation cannot be empty'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match. Please try again.",
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Forgot password — email only (matches backend)
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .min(1, 'Email cannot be empty')
    .trim()
    .email('Please enter a valid email address')
    .refine((val) => emailRegex.test(val), { message: 'Invalid email format' })
    .transform((val) => val.toLowerCase()),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password — token + new password
 */
export const resetPasswordSchema = z
  .object({
    token: z.string({ required_error: 'Reset code is required' }).min(1, 'Reset code is required').trim(),
    password: passwordValidation,
    confirmPassword: z
      .string({ required_error: 'Please confirm your password' })
      .min(1, 'Password confirmation cannot be empty'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

