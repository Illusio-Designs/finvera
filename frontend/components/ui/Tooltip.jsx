import { useId, useState } from 'react';

export default function Tooltip({
  content,
  children,
  side = 'top',
  className = '',
}) {
  const id = useId();
  const [open, setOpen] = useState(false);

  const sideClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined} tabIndex={0} className="inline-flex">
        {children}
      </span>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className={
            "absolute z-50 px-2 py-1 rounded bg-gray-900 text-white text-xs shadow-lg whitespace-nowrap " +
            sideClasses[side]
          }
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
