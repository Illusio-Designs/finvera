import { useEffect, useRef, useState } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';

export function MobileMenuHamburger({ open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
      aria-label={open ? 'Close menu' : 'Open menu'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
      </svg>
    </button>
  );
}

export function BottomNavigationBar({ items = [], active, onChange }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40">
      <div className="grid grid-cols-4">
        {items.map((it) => {
          const isActive = active === it.value;
          return (
            <button
              key={it.value}
              type="button"
              onClick={() => onChange?.(it.value)}
              className={
                "py-3 text-xs font-medium flex flex-col items-center gap-1 " +
                (isActive ? 'text-primary-700' : 'text-gray-600')
              }
            >
              {it.icon}
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function SwipeActions({ children, leftAction, rightAction }) {
  // lightweight placeholder: show actions buttons
  return (
    <div className="relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2">{leftAction}</div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2">{rightAction}</div>
      <div className="px-12">{children}</div>
    </div>
  );
}

export function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  return (
    <div>
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          loading={refreshing}
          onClick={async () => {
            setRefreshing(true);
            try {
              await onRefresh?.();
            } finally {
              setRefreshing(false);
            }
          }}
        >
          Refresh
        </Button>
      </div>
      {children}
    </div>
  );
}

export function MobileOptimizedForms({ children }) {
  return <Card className="shadow-sm"><div className="space-y-4">{children}</div></Card>;
}
