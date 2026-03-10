/**
 * Input Atom
 * Reusable text input component with validation states
 */

import React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

interface IInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-4 py-3 text-base',
};

const Input = React.forwardRef<HTMLInputElement, IInputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s/g, '-') || Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    const baseStyles = 'border rounded-xl focus:ring-2 focus:outline-none transition-all';
    const stateStyles = hasError
      ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
      : 'border-gray-200 bg-white focus:ring-teal-primary/20 focus:border-teal-primary';

    const combinedClassName = [
      baseStyles,
      stateStyles,
      sizeStyles[size],
      fullWidth ? 'w-full' : '',
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-teal-deep mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={combinedClassName}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate">
              {rightIcon}
            </div>
          )}
        </div>
        {hasError && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        {helperText && !hasError && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-slate">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
