import { useEffect, useState } from 'react';
import Button from '../../ui/Button';
import ConfirmDialog from '../../ui/ConfirmDialog';
import Modal from '../../ui/Modal';

export function ConfirmationDialog(props) {
  return <ConfirmDialog {...props} />;
}

export function AlertWarningModal({ isOpen, onClose, title = 'Warning', message, onAcknowledge }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="text-sm text-gray-700">{message}</div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="danger" onClick={onAcknowledge}>OK</Button>
        </div>
      </div>
    </Modal>
  );
}

export function FullScreenModal({ isOpen, onClose, title, children }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="full" className="h-[90vh]">
      <div className="h-[75vh] overflow-auto">{children}</div>
    </Modal>
  );
}

export function DrawerSlideOutPanel({ isOpen, onClose, title, children, side = 'right' }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sideClass = side === 'left' ? 'left-0' : 'right-0';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
      <div className={`absolute top-0 ${sideClass} h-full w-full max-w-md bg-white shadow-xl flex flex-col`}>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">{title}</div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="p-6 overflow-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export function BottomSheetMobile({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
      <div className="relative w-full rounded-t-2xl bg-white shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function DialogBackdropOverlay({ isOpen }) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-gray-900/40" aria-hidden="true" />;
}
