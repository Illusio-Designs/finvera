import { useId, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({
  content,
  children,
  side = 'top',
  className = '',
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return;
        
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          if (!triggerRef.current) return;
          
          const triggerRect = triggerRef.current.getBoundingClientRect();
          
          let top = 0;
          let left = 0;

          if (side === 'right') {
            top = triggerRect.top + (triggerRect.height / 2);
            left = triggerRect.right + 12;
          } else if (side === 'left') {
            top = triggerRect.top + (triggerRect.height / 2);
            left = triggerRect.left - 12;
          } else if (side === 'top') {
            top = triggerRect.top - 8;
            left = triggerRect.left + (triggerRect.width / 2);
          } else {
            top = triggerRect.bottom + 8;
            left = triggerRect.left + (triggerRect.width / 2);
          }

          setPosition({ top, left });
        });
      };

      // Initial position - delay slightly to ensure accurate measurement
      const timeoutId = setTimeout(updatePosition, 0);

      // Update on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      // Reset position when closed
      setPosition({ top: 0, left: 0 });
    }
  }, [open, side]);

  const sideClasses = {
    top: '',
    bottom: '',
    left: '',
    right: '',
  };

  return (
    <>
      <span
        ref={triggerRef}
        className={`relative block ${className}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <span aria-describedby={open ? id : undefined} tabIndex={0} className="block w-full">
          {children}
        </span>
      </span>
      {open && typeof document !== 'undefined' && createPortal(
        <span
          ref={tooltipRef}
          id={id}
          role="tooltip"
          className="fixed z-[60] px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium shadow-xl whitespace-nowrap pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: side === 'right' || side === 'left' 
              ? 'translateY(-50%)' 
              : side === 'top' 
              ? 'translateX(-50%) translateY(-100%)' 
              : 'translateX(-50%)',
            visibility: position.top === 0 && position.left === 0 ? 'hidden' : 'visible',
          }}
        >
          {content}
          {side === 'right' && (
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></span>
          )}
        </span>,
        document.body
      )}
    </>
  );
}
