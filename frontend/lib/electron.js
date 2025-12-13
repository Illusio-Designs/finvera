/**
 * Electron Utilities
 * Helper functions for working with Electron environment
 */

/**
 * Check if the app is running in Electron
 * @returns {boolean}
 */
export const isElectron = () => {
  if (typeof window !== 'undefined') {
    return window.electronAPI && window.electronAPI.isElectron === true;
  }
  return false;
};

/**
 * Get the Electron API if available
 * @returns {object|null}
 */
export const getElectronAPI = () => {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI;
  }
  return null;
};

/**
 * Store operations (Electron persistent storage)
 */
export const electronStore = {
  /**
   * Get a value from the store
   * @param {string} key
   * @returns {Promise<any>}
   */
  get: async (key) => {
    if (!isElectron()) return null;
    const api = getElectronAPI();
    return api ? await api.store.get(key) : null;
  },

  /**
   * Set a value in the store
   * @param {string} key
   * @param {any} value
   * @returns {Promise<boolean>}
   */
  set: async (key, value) => {
    if (!isElectron()) return false;
    const api = getElectronAPI();
    return api ? await api.store.set(key, value) : false;
  },

  /**
   * Delete a value from the store
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  delete: async (key) => {
    if (!isElectron()) return false;
    const api = getElectronAPI();
    return api ? await api.store.delete(key) : false;
  },

  /**
   * Clear all values from the store
   * @returns {Promise<boolean>}
   */
  clear: async () => {
    if (!isElectron()) return false;
    const api = getElectronAPI();
    return api ? await api.store.clear() : false;
  },
};

/**
 * App information
 */
export const electronApp = {
  /**
   * Get the app version
   * @returns {Promise<string|null>}
   */
  getVersion: async () => {
    if (!isElectron()) return null;
    const api = getElectronAPI();
    return api ? await api.app.getVersion() : null;
  },

  /**
   * Get app path
   * @param {string} name - Path name (e.g., 'userData', 'temp', 'home')
   * @returns {Promise<string|null>}
   */
  getPath: async (name) => {
    if (!isElectron()) return null;
    const api = getElectronAPI();
    return api ? await api.app.getPath(name) : null;
  },

  /**
   * Get the platform
   * @returns {string|null}
   */
  getPlatform: () => {
    if (!isElectron()) return null;
    const api = getElectronAPI();
    return api ? api.platform : null;
  },
};

/**
 * Check if running on macOS
 * @returns {boolean}
 */
export const isMac = () => {
  const platform = electronApp.getPlatform();
  return platform === 'darwin';
};

/**
 * Check if running on Windows
 * @returns {boolean}
 */
export const isWindows = () => {
  const platform = electronApp.getPlatform();
  return platform === 'win32';
};

/**
 * Check if running on Linux
 * @returns {boolean}
 */
export const isLinux = () => {
  const platform = electronApp.getPlatform();
  return platform === 'linux';
};
