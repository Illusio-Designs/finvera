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
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
          className={`
            inline-flex
            items-center
            justify-center
            w-full
            text-sm
            font-medium
            leading-5
            px-4
            py-2.5
            box-border
            border
            border-transparent
            rounded-lg
            shadow-sm
            transition-all
            duration-200
            focus:outline-none
            focus:ring-4
            cursor-pointer
            appearance-none
            pr-10
            ${error 
              ? 'text-white bg-red-500 hover:bg-red-600 focus:ring-red-300 border-red-500' 
              : 'text-white bg-primary-500 hover:bg-primary-600 focus:ring-primary-300'
            }
            disabled:bg-gray-400
            disabled:text-gray-200
            disabled:cursor-not-allowed
            disabled:hover:bg-gray-400
            ${className}
          `.replace(/\s+/g, ' ').trim()}
          {...props}
        >
        <option value="" className="bg-white text-gray-900">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white text-gray-900">
            {option.label}
          </option>
        ))}
      </select>
      <svg 
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-white" 
        aria-hidden="true" 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <path 
          stroke="currentColor" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          d="m19 9-7 7-7-7"
        />
      </svg>
      </div>
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

