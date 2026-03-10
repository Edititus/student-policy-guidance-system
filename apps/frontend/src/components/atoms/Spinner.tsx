/**
 * Spinner Atom
 * Loading indicator with size variants
 */

import React from 'react';
import Icon from './Icon';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface ISpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

const sizePx: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
};

const Spinner: React.FC<ISpinnerProps> = ({
  size = 'md',
  className = '',
  label,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Icon name="spinner" size={sizePx[size]} className="text-teal-primary" />
      {label && <p className="text-slate mt-2 text-sm">{label}</p>}
    </div>
  );
};

export default Spinner;
