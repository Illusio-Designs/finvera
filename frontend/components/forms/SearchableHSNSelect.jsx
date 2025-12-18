import { useState, useEffect, useRef } from 'react';
import { hsnAPI } from '../../lib/api';
import { FiSearch, FiX, FiChevronDown } from 'react-icons/fi';
import { useDebounce } from '../../hooks/useDebounce';

export default function SearchableHSNSelect({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder = 'Search HSN/SAC code...',
  required = false,
  disabled = false,
  className = '',
  onHSNSelect, // Callback when HSN is selected to auto-fill other fields
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedHSN, setSelectedHSN] = useState(null);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const isMountedRef = useRef(true);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch HSN codes when search term changes
  useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      setLoading(true);
      hsnAPI
        .search(debouncedSearchTerm)
        .then((response) => {
          // Only update state if component is still mounted
          if (!isMountedRef.current) return;
          
          // Handle both { success: true, data: [...] } and direct array responses
          const data = response.data?.success !== undefined 
            ? (response.data?.data || [])
            : (response.data || []);
          setOptions(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch((error) => {
          // Only update state if component is still mounted
          if (!isMountedRef.current) return;
          
          // Don't log 429 errors (rate limiting)
          if (error.response?.status !== 429) {
            console.error('Error searching HSN:', error);
          }
          setOptions([]);
          setLoading(false);
        });
    } else {
      setOptions([]);
    }
  }, [debouncedSearchTerm]);

  // Load selected HSN details if value is provided
  useEffect(() => {
    if (value && !selectedHSN && value !== searchTerm) {
      hsnAPI
        .get(value)
        .then((response) => {
          // Handle both { success: true, data: {...} } and direct object responses
          const data = response.data?.success !== undefined
            ? response.data?.data
            : response.data;
          if (data) {
            setSelectedHSN(data);
            setSearchTerm(data.code);
          } else {
            setSearchTerm(value);
          }
        })
        .catch(() => {
          // If HSN not found, just use the code as-is
          setSearchTerm(value);
        });
    } else if (!value) {
      setSelectedHSN(null);
      setSearchTerm('');
    }
  }, [value, selectedHSN, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (hsn) => {
    setSelectedHSN(hsn);
    setSearchTerm(hsn.code);
    setIsOpen(false);
    
    // Trigger onChange with the HSN code
    if (onChange) {
      onChange(name, hsn.code);
    }

    // Auto-fill related fields if callback provided
    if (onHSNSelect) {
      onHSNSelect({
        hsn_sac_code: hsn.code,
        gst_rate: hsn.gst_rate ? parseFloat(hsn.gst_rate) : null,
        uqc: hsn.uqc_code || null,
      });
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // If user clears the input, clear the selected HSN
    if (!newValue) {
      setSelectedHSN(null);
      if (onChange) {
        onChange(name, '');
      }
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchTerm.length >= 2) {
      // Re-fetch if there's a search term
      setLoading(true);
      hsnAPI
        .search(searchTerm)
        .then((response) => {
          // Handle both { success: true, data: [...] } and direct array responses
          const data = response.data?.success !== undefined 
            ? (response.data?.data || [])
            : (response.data || []);
          setOptions(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          setOptions([]);
          setLoading(false);
        });
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedHSN(null);
    setIsOpen(false);
    if (onChange) {
      onChange(name, '');
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`w-full ${className}`} ref={wrapperRef}>
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
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            id={name}
            name={name}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`
              w-full
              pl-10
              pr-20
              py-2.5
              border
              rounded-lg
              bg-gray-50
              text-gray-900
              text-sm
              placeholder-gray-500
              transition-all
              duration-200
              focus:outline-none
              focus:ring-1
              focus:ring-primary-500
              focus:border-primary-500
              focus:bg-white
              disabled:bg-gray-100
              disabled:text-gray-400
              disabled:cursor-not-allowed
              disabled:border-gray-200
              ${error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300'
              }
            `.replace(/\s+/g, ' ').trim()}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchTerm && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
            <FiChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Searching...
              </div>
            ) : options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {searchTerm.length < 2
                  ? 'Type at least 2 characters to search'
                  : 'No HSN/SAC codes found'}
              </div>
            ) : (
              <ul className="py-1">
                {options.map((hsn) => (
                  <li
                    key={hsn.code}
                    onClick={() => handleSelect(hsn)}
                    className={`
                      px-4 py-2 cursor-pointer hover:bg-primary-50 transition-colors
                      ${selectedHSN?.code === hsn.code ? 'bg-primary-100' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{hsn.code}</div>
                        {hsn.trade_description && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {hsn.trade_description}
                          </div>
                        )}
                        {hsn.technical_description && (
                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {hsn.technical_description}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 text-right text-xs text-gray-500">
                        {hsn.gst_rate && (
                          <div>GST: {parseFloat(hsn.gst_rate)}%</div>
                        )}
                        {hsn.uqc_code && <div>UQC: {hsn.uqc_code}</div>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm font-medium text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
