import { useEffect, useRef, useState } from 'react';

export default function Popover({
  trigger,
  children,
  align = 'end',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const alignClasses = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div className={`relative inline-flex ${className}`} ref={ref}>
      <div onClick={() => setOpen((v) => !v)} className="inline-flex">
        {trigger}
      </div>
      {open ? (
        <div
          className={`absolute z-50 mt-2 ${alignClasses[align]} min-w-[12rem] rounded-lg border border-gray-200 bg-white shadow-lg`}
          role="dialog"
        >
          <div className="p-3">{children}</div>
        </div>
      ) : null}
    </div>
  );
}
