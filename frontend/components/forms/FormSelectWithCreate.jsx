import { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiPlus } from 'react-icons/fi';

export default function FormSelectWithCreate({
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
  onCreateClick,
  createButtonText = 'Create New',
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const dropdownRef = useRef(null);

  // Find selected option
  useEffect(() => {
    if (value) {
      const option = options.find(opt => opt.value === value);
      setSelectedOption(option || null);
    } else {
      setSelectedOption(null);
    }
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (onChange) {
      const syntheticEvent = {
        target: {
          name: name,
          value: option.value,
        },
      };
      onChange(syntheticEvent);
    }
    if (onBlur) {
      onBlur();
    }
  };

  const handleCreateClick = () => {
    setIsOpen(false);
    if (onCreateClick) {
      onCreateClick();
    }
  };

  return (
    <div className="w-full" ref={dropdownRef}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-normal text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 
            bg-white border rounded-lg transition-all shadow-sm
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }
            ${disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100 hover:border-gray-300' 
              : 'cursor-pointer'
            }
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            ${className}
          `.replace(/\s+/g, ' ').trim()}
          {...props}
        >
          <span className="flex-1 text-left truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <FiChevronDown 
            className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isOpen && !disabled && (
          <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[10000] max-h-80 overflow-y-auto scrollbar-hide">
            {/* Create Button */}
            {onCreateClick && (
              <>
                <button
                  type="button"
                  onClick={handleCreateClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition bg-gradient-to-r from-primary-50 to-primary-100/50 hover:from-primary-100 hover:to-primary-150 text-primary-700 font-medium border-b border-primary-200"
                >
                  <div className="flex items-center justify-center w-5 h-5 bg-primary-500 rounded-full">
                    <FiPlus className="h-3 w-3 text-white" />
                  </div>
                  <span className="flex-1">{createButtonText}</span>
                </button>
                {options.length > 0 && (
                  <div className="border-t border-gray-100 my-1"></div>
                )}
              </>
            )}
            
            {/* Options */}
            {options.length === 0 && !onCreateClick ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition
                      ${isSelected
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="flex-1 truncate">{option.label}</span>
                    {isSelected && (
                      <span className="text-primary-600 text-xs font-medium">Selected</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
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