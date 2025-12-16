export default function ToggleSwitch({
  label,
  name,
  checked = false,
  onChange,
  disabled = false,
  description,
  className = '',
  ...props
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {label ? <div className="text-sm font-medium text-gray-900">{label}</div> : null}
        {description ? <div className="text-sm text-gray-500">{description}</div> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.({ target: { name, checked: !checked } })}
        className={
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 " +
          (disabled ? 'opacity-60 cursor-not-allowed ' : 'cursor-pointer ') +
          (checked ? 'bg-primary-600' : 'bg-gray-200')
        }
        {...props}
      >
        <span
          className={
            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ' +
            (checked ? 'translate-x-5' : 'translate-x-1')
          }
        />
      </button>
    </div>
  );
}
