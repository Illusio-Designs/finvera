import { useEffect } from 'react';
import IconButton from './IconButton';

export default function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Background overlay - covers everything including header with low opacity */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal container - centered using flexbox */}
      <div className="flex min-h-full items-center justify-center p-4 pointer-events-none">
        {/* Modal panel */}
        <div
          className={`relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full pointer-events-auto ${sizes[size]} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <IconButton
                label="Close"
                variant="ghost"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </IconButton>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4 max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-hide">{children}</div>
        </div>
      </div>
    </div>
  );
}
