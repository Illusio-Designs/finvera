import { useState } from 'react';
import Button from '../ui/Button';

export default function FileUpload({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  accept,
  required = false,
  disabled = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = '',
  ...props
}) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > maxSize) {
      if (onChange) {
        onChange(name, null, `File size must be less than ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
      }
      return;
    }

    setFileName(file.name);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    if (onChange) {
      onChange(name, file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName('');
    if (onChange) {
      onChange(name, null);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="mt-1 flex items-center space-x-5">
        <label
          htmlFor={name}
          className={`
            cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm
            text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error && touched ? 'border-red-500' : ''}
          `}
        >
          <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Choose File
        </label>
        <input
          id={name}
          name={name}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
          className="hidden"
          {...props}
        />
        {fileName && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{fileName}</span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {preview && (
        <div className="mt-4">
          <img src={preview} alt="Preview" className="max-w-xs max-h-48 rounded-md" />
        </div>
      )}
      {error && touched && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

