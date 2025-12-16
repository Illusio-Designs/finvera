export default function IconButton({
  children,
  label,
  variant = 'ghost',
  onClick,
  disabled = false,
  className = '',
  ...props
}) {
  const variants = {
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    primary: 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
    danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={
        "inline-flex items-center justify-center rounded-md p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed " +
        variants[variant] +
        ' ' +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}
