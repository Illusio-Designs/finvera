const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Store operations
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value),
    delete: (key) => ipcRenderer.invoke('store-delete', key),
    clear: () => ipcRenderer.invoke('store-clear'),
  },
  
  // App information
  app: {
    getVersion: () => ipcRenderer.invoke('app-version'),
    getPath: (name) => ipcRenderer.invoke('app-path', name),
  },

  // Platform information
  platform: process.platform,
  
  // Check if running in Electron
  isElectron: true,
});

// Log that preload script has loaded
console.log('Electron preload script loaded successfully');
