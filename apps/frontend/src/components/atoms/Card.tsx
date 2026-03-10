/**
 * Card Atom
 * Reusable card container with padding and shadow variants
 */

import React from 'react';

export type CardVariant = 'elevated' | 'outlined' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface ICardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  elevated: 'bg-white rounded-2xl shadow-lg border border-gray-100',
  outlined: 'bg-white rounded-2xl border border-gray-200',
  flat: 'bg-white rounded-2xl',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const Card: React.FC<ICardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  className = '',
  onClick,
  hoverable = false,
}) => {
  const combinedClassName = [
    variantStyles[variant],
    paddingStyles[padding],
    hoverable ? 'transition-shadow hover:shadow-xl cursor-pointer' : '',
    onClick ? 'cursor-pointer' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={combinedClassName} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
