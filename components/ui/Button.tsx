import React from 'react';
import { HapticsService } from '../../services/capacitorService';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  onClick,
  ...props 
}) => {
  
  const baseStyles = "min-h-[56px] rounded-2xl font-semibold text-lg transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:active:scale-100";
  
  const variants = {
    primary: "bg-moover-blue text-white shadow-lg shadow-blue-500/30",
    secondary: "bg-moover-dark text-white",
    danger: "bg-red-500 text-white",
    outline: "border-2 border-gray-200 text-moover-dark bg-white"
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!props.disabled) {
      HapticsService.impact('LIGHT');
      if (onClick) onClick(e);
    }
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};