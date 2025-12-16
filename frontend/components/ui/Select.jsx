export default function Select({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  options = [],
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        className={`
          w-full
          px-4
          py-2.5
          border
          rounded-lg
          shadow-sm
          bg-white
          text-gray-900
          transition-all
          duration-200
          focus:outline-none
          focus:ring-2
          focus:ring-primary-500/20
          focus:border-primary-500
          focus:shadow-md
          focus:shadow-primary-500/10
          disabled:bg-gray-50
          disabled:text-gray-500
          disabled:cursor-not-allowed
          disabled:border-gray-200
          cursor-pointer
          appearance-none
          bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")] 
          bg-[length:1.5em_1.5em]
          bg-[right_0.75rem_center]
          bg-no-repeat
          pr-10
          ${error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${className}
        `.replace(/\s+/g, ' ').trim()}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm font-medium text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

