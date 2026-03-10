/**
 * Badge Atom
 * Status indicator for confidence levels, counts, and labels
 */

import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'high' | 'medium' | 'low';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface IBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const Badge: React.FC<IBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const combinedClassName = [
    'inline-flex items-center font-medium rounded-full',
    variantStyles[variant],
    sizeStyles[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={combinedClassName}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            variant === 'success' || variant === 'high'
              ? 'bg-green-500'
              : variant === 'warning' || variant === 'medium'
              ? 'bg-yellow-500'
              : variant === 'error' || variant === 'low'
              ? 'bg-red-500'
              : variant === 'info'
              ? 'bg-blue-500'
              : 'bg-gray-500'
          }`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
