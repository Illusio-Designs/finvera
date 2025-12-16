import { useState } from 'react';

export default function Accordion({
  items = [],
  className = '',
}) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className={`divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white ${className}`}>
      {items.map((it, idx) => {
        const open = openIndex === idx;
        return (
          <div key={it.id ?? idx}>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
              onClick={() => setOpenIndex(open ? null : idx)}
            >
              <span className="text-sm font-medium text-gray-900">{it.title}</span>
              <span className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </button>
            {open ? <div className="px-4 pb-4 text-sm text-gray-600">{it.content}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
