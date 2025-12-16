import { useEffect, useRef, useState } from 'react';

export default function DropdownMenu({
  trigger,
  items = [],
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
        <div className={`absolute z-50 mt-2 ${alignClasses[align]} min-w-[12rem] rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden`}>
          {items.map((it, idx) => (
            <button
              key={it.key ?? idx}
              type="button"
              onClick={() => {
                it.onClick?.();
                setOpen(false);
              }}
              className={
                "w-full px-4 py-2 text-left text-sm transition-colors " +
                (it.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-50')
              }
              disabled={it.disabled}
            >
              <div className="font-medium">{it.label}</div>
              {it.description ? <div className="text-xs text-gray-500">{it.description}</div> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
