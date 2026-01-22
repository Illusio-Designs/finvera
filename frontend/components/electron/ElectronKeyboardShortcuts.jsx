import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useElectron } from '../../contexts/ElectronContext';

const ElectronKeyboardShortcuts = () => {
  const router = useRouter();
  const { isElectron } = useElectron();

  useEffect(() => {
    if (!isElectron) return;

    const handleKeyDown = (event) => {
      const { ctrlKey, metaKey, key, shiftKey } = event;
      const cmdOrCtrl = ctrlKey || metaKey;

      // Prevent default browser shortcuts in Electron
      if (cmdOrCtrl) {
        switch (key.toLowerCase()) {
          case 'd':
            event.preventDefault();
            router.push('/client/dashboard');
            break;
          case 'v':
            if (!shiftKey) {
              event.preventDefault();
              router.push('/client/vouchers/vouchers');
            }
            break;
          case 'l':
            event.preventDefault();
            router.push('/client/ledgers');
            break;
          case 'i':
            event.preventDefault();
            router.push('/client/inventory-items-unified');
            break;
          case 'r':
            if (shiftKey) {
              event.preventDefault();
              router.push('/client/reports');
            }
            break;
          case 'g':
            event.preventDefault();
            router.push('/client/gst/returns/gstr1');
            break;
          case 'e':
            event.preventDefault();
            router.push('/client/einvoice');
            break;
          case 't':
            event.preventDefault();
            router.push('/client/tds');
            break;
          case ',':
            event.preventDefault();
            router.push('/client/settings');
            break;
          case 'n':
            event.preventDefault();
            // Quick create voucher
            router.push('/client/vouchers/sales-invoice');
            break;
          case 'f':
            if (shiftKey) {
              event.preventDefault();
              // Focus search (if implemented)
              const searchInput = document.querySelector('[data-search-input]');
              if (searchInput) {
                searchInput.focus();
              }
            }
            break;
          default:
            break;
        }
      }

      // Function keys
      switch (key) {
        case 'F1':
          event.preventDefault();
          router.push('/client/support');
          break;
        case 'F2':
          event.preventDefault();
          // Quick edit mode (if implemented)
          break;
        case 'F5':
          event.preventDefault();
          window.location.reload();
          break;
        case 'Escape':
          // Close modals or go back
          const modal = document.querySelector('[data-modal]');
          if (modal) {
            const closeButton = modal.querySelector('[data-modal-close]');
            if (closeButton) {
              closeButton.click();
            }
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isElectron, router]);

  return null; // This component doesn't render anything
};

export default ElectronKeyboardShortcuts;