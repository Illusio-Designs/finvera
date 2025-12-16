import { useState } from 'react';

export default function PasswordInput({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required ? <span className="text-red-500 ml-1">*</span> : null}
        </label>
      ) : null}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={
            `w-full px-3 py-2 pr-10 border rounded-md shadow-sm ` +
            `focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ` +
            `disabled:bg-gray-100 disabled:cursor-not-allowed ` +
            `${error ? 'border-red-500' : 'border-gray-300'} ` +
            className
          }
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.8 21.8 0 015.06-6.94" />
              <path d="M1 1l22 22" />
              <path d="M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.8 21.8 0 01-3.17 4.25" />
              <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
