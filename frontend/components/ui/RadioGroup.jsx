export default function RadioGroup({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  error,
  className = '',
}) {
  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <div className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required ? <span className="text-red-500 ml-1">*</span> : null}
        </div>
      ) : null}
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={
              "flex items-center gap-2 text-sm " +
              (disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer')
            }
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={onChange}
              disabled={disabled}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">{opt.label}</span>
          </label>
        ))}
      </div>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
