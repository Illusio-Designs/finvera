const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  
  // Navigation
  navigateTo: (path) => ipcRenderer.invoke('navigate:to', path),
  
  // File operations (if needed)
  selectFile: () => ipcRenderer.invoke('file:select'),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('notification:show', title, body)
});

// Remove node integration for security
delete window.require;
delete window.exports;
delete window.module;