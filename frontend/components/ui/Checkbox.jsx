export default function Checkbox({
  label,
  name,
  checked = false,
  onChange,
  disabled = false,
  required = false,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      <label className={`inline-flex items-start gap-2 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
        <span className="relative mt-0.5">
          <input
            type="checkbox"
            name={name}
            checked={!!checked}
            onChange={(e) => onChange?.(e)}
            disabled={disabled}
            required={required}
            className="peer sr-only"
            {...props}
          />
          <span
            className={
              "h-4 w-4 rounded border border-gray-300 bg-white inline-flex items-center justify-center " +
              "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2 " +
              "peer-checked:bg-primary-600 peer-checked:border-primary-600"
            }
            aria-hidden="true"
          >
            <svg
              className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </span>
        {label ? (
          <span className="text-sm text-gray-700">
            {label}
            {required ? <span className="text-red-500 ml-1">*</span> : null}
          </span>
        ) : null}
      </label>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
