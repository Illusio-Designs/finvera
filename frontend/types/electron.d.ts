// Type definitions for Electron API
interface ElectronAPI {
  // App info
  getVersion: () => Promise<string>;
  
  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  
  // Navigation
  navigateTo: (path: string) => Promise<void>;
  
  // File operations
  selectFile: () => Promise<string | null>;
  
  // Notifications
  showNotification: (title: string, body: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};