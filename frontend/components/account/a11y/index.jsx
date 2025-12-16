import { useEffect, useId, useRef } from 'react';
import Modal from '../../ui/Modal';

export function SkipToContentLink({ href = '#main', label = 'Skip to content' }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-gray-900 focus:px-4 focus:py-2 focus:rounded-md focus:shadow"
    >
      {label}
    </a>
  );
}

export function ScreenReaderText({ children }) {
  return <span className="sr-only">{children}</span>;
}

export function KeyboardNavigationIndicators() {
  return (
    <style jsx global>{`
      :focus-visible { outline: 2px solid #3e60ab; outline-offset: 2px; }
    `}</style>
  );
}

export function FocusTrapModal({ isOpen, onClose, title, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const root = ref.current;
    if (!root) return;

    const focusable = root.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus?.();

    function onKeyDown(e) {
      if (e.key !== 'Tab') return;
      if (!focusable.length) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus?.();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus?.();
      }
    }

    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div ref={ref}>{children}</div>
    </Modal>
  );
}

export function AriaLiveRegionAnnouncements({ message }) {
  const id = useId();
  return (
    <div id={id} aria-live="polite" aria-atomic="true" className="sr-only">
      {message || ''}
    </div>
  );
}
