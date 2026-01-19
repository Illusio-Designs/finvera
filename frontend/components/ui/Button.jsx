import { forwardRef } from 'react';
import LoadingSpinner from './LoadingSpinner';

const Button = forwardRef(function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  fullWidth = false,
  icon,
  ...props
}, ref) {
  // Base classes with modern SaaS styling
  const baseClasses = `
    font-normal
    rounded-lg
    transition-all
    duration-200
    ease-in-out
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:transform-none
    disabled:hover:shadow-none
    active:scale-[0.98]
    relative
    overflow-hidden
  `;
  
  // Modern SaaS button variants with shadows and hover effects
  const variants = {
    primary: `
      bg-primary-600
      text-white
      shadow-md
      shadow-primary-600/25
      hover:bg-primary-700
      hover:shadow-lg
      hover:shadow-primary-600/40
      hover:-translate-y-0.5
      focus:ring-primary-500
      active:bg-primary-800
    `,
    secondary: `
      bg-gray-600
      text-white
      shadow-md
      shadow-gray-600/25
      hover:bg-gray-700
      hover:shadow-lg
      hover:shadow-gray-600/40
      hover:-translate-y-0.5
      focus:ring-gray-500
      active:bg-gray-800
    `,
    danger: `
      bg-red-600
      text-white
      shadow-md
      shadow-red-600/25
      hover:bg-red-700
      hover:shadow-lg
      hover:shadow-red-600/40
      hover:-translate-y-0.5
      focus:ring-red-500
      active:bg-red-800
    `,
    success: `
      bg-green-600
      text-white
      shadow-md
      shadow-green-600/25
      hover:bg-green-700
      hover:shadow-lg
      hover:shadow-green-600/40
      hover:-translate-y-0.5
      focus:ring-green-500
      active:bg-green-800
    `,
    outline: `
      bg-transparent
      border-2
      border-primary-600
      text-primary-600
      shadow-sm
      hover:bg-primary-50
      hover:border-primary-700
      hover:text-primary-700
      hover:shadow-md
      hover:-translate-y-0.5
      focus:ring-primary-500
      active:bg-primary-100
    `,
    ghost: `
      bg-transparent
      text-gray-700
      hover:bg-gray-100
      hover:text-gray-900
      focus:ring-gray-500
      active:bg-gray-200
    `,
  };
  
  // Size variants with proper padding and font sizes
  const sizes = {
    sm: 'px-3 py-1.5 text-sm font-normal',
    md: 'px-5 py-2.5 text-sm font-normal',
    lg: 'px-6 py-3 text-base font-normal',
  };
  
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <LoadingSpinner size="sm" className="-ml-1 mr-2" />
          Loading...
        </span>
      ) : (
        <span className="relative z-10 flex items-center justify-center">
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </span>
      )}
    </button>
  );
});

export default Button;

