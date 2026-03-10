/**
 * Button Atom
 * Reusable button component with variants, sizes, and states
 */

import React from 'react';
import Icon from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-teal-primary text-white hover:bg-ocean-deep focus:ring-teal-primary/20',
  secondary: 'bg-teal-mist text-teal-deep hover:bg-teal-bright focus:ring-teal-bright/20',
  outline: 'bg-transparent border border-teal-primary text-teal-primary hover:bg-teal-mist focus:ring-teal-primary/20',
  ghost: 'bg-transparent text-slate hover:bg-gray-100 hover:text-teal-deep focus:ring-gray-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button: React.FC<IButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Icon name="spinner" size={16} className="-ml-1 mr-2" />
      ) : leftIcon ? (
        <span className="mr-2 -ml-0.5">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !isLoading && <span className="ml-2 -mr-0.5">{rightIcon}</span>}
    </button>
  );
};

export default Button;
