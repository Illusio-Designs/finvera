import { useState, useEffect } from 'react';
import { FiMinus, FiSquare, FiMaximize2, FiX } from 'react-icons/fi';

export default function ElectronWindowControls({ className = '' }) {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(typeof window !== 'undefined' && window.electronAPI);
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimize();
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.maximize();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.close();
    }
  };

  // Don't render if not in Electron
  if (!isElectron) {
    return null;
  }

  return (
    <div className={`flex items-center no-drag ${className}`}>
      <button
        onClick={handleMinimize}
        className="p-2 hover:bg-gray-200 rounded transition-colors"
        title="Minimize"
      >
        <FiMinus size={14} />
      </button>
      <button
        onClick={handleMaximize}
        className="p-2 hover:bg-gray-200 rounded transition-colors"
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? <FiSquare size={14} /> : <FiMaximize2 size={14} />}
      </button>
      <button
        onClick={handleClose}
        className="p-2 hover:bg-red-500 hover:text-white rounded transition-colors"
        title="Close"
      >
        <FiX size={14} />
      </button>
    </div>
  );
}