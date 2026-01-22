import { useEffect } from 'react';
import ElectronClientRouter from './ElectronClientRouter';

const ElectronWrapper = ({ children }) => {
  useEffect(() => {
    // Add Electron-specific CSS classes
    if (typeof window !== 'undefined' && window.electronAPI) {
      document.body.classList.add('electron-app');
      
      // Add custom CSS for Electron
      const style = document.createElement('style');
      style.textContent = `
        .electron-app {
          user-select: none;
          -webkit-user-select: none;
          -webkit-app-region: no-drag;
        }
        
        .drag-region {
          -webkit-app-region: drag;
        }
        
        .no-drag {
          -webkit-app-region: no-drag;
        }
        
        /* Custom scrollbars for Electron */
        .electron-app ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .electron-app ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .electron-app ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        .electron-app ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        /* Disable text selection in UI elements */
        .electron-app button,
        .electron-app .sidebar,
        .electron-app .titlebar {
          -webkit-user-select: none;
          user-select: none;
        }
        
        /* Allow text selection in content areas */
        .electron-app input,
        .electron-app textarea,
        .electron-app [contenteditable],
        .electron-app .content-area {
          -webkit-user-select: text;
          user-select: text;
        }
        
        /* Hide window controls on web - they're handled by Electron */
        .electron-app .window-controls {
          display: none;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.body.classList.remove('electron-app');
        document.head.removeChild(style);
      };
    }
  }, []);

  return (
    <ElectronClientRouter>
      {children}
    </ElectronClientRouter>
  );
};

export default ElectronWrapper;