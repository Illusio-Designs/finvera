import { useState, useEffect } from 'react';
import { 
  isElectron, 
  electronStore, 
  electronApp, 
  isMac, 
  isWindows, 
  isLinux 
} from '../lib/electron';
import ElectronInfo from '../components/ElectronInfo';

/**
 * Electron Demo Page
 * Demonstrates Electron features and APIs
 * Access at: http://localhost:3000/electron-demo
 */
export default function ElectronDemo() {
  const [storageKey, setStorageKey] = useState('demo-key');
  const [storageValue, setStorageValue] = useState('');
  const [storedData, setStoredData] = useState(null);
  const [appVersion, setAppVersion] = useState(null);
  const [userDataPath, setUserDataPath] = useState(null);

  useEffect(() => {
    if (isElectron()) {
      loadAppInfo();
    }
  }, []);

  const loadAppInfo = async () => {
    const version = await electronApp.getVersion();
    const path = await electronApp.getPath('userData');
    setAppVersion(version);
    setUserDataPath(path);
  };

  const handleSave = async () => {
    if (!storageKey || !storageValue) {
      alert('Please enter both key and value');
      return;
    }
    const success = await electronStore.set(storageKey, storageValue);
    if (success) {
      alert('Data saved successfully!');
      setStorageValue('');
    } else {
      alert('Failed to save data (not running in Electron?)');
    }
  };

  const handleLoad = async () => {
    if (!storageKey) {
      alert('Please enter a key');
      return;
    }
    const data = await electronStore.get(storageKey);
    setStoredData(data);
  };

  const handleDelete = async () => {
    if (!storageKey) {
      alert('Please enter a key');
      return;
    }
    const success = await electronStore.delete(storageKey);
    if (success) {
      alert('Data deleted successfully!');
      setStoredData(null);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all stored data?')) {
      const success = await electronStore.clear();
      if (success) {
        alert('All data cleared!');
        setStoredData(null);
      }
    }
  };

  const getPlatformInfo = () => {
    if (isMac()) return '🍎 macOS';
    if (isWindows()) return '🪟 Windows';
    if (isLinux()) return '🐧 Linux';
    return '❓ Unknown';
  };

  if (!isElectron()) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Not Running in Electron
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>This demo page requires Electron to function properly.</p>
                  <p className="mt-1">
                    Run: <code className="bg-yellow-100 px-2 py-1 rounded">npm run electron:dev</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Electron Features Demo
          </h1>
          <p className="text-gray-600">
            This page demonstrates the Electron features available in your Finvera desktop app.
          </p>
        </div>

        {/* App Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Application Information
          </h2>
          <ElectronInfo />
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm font-medium text-gray-500">Platform</p>
              <p className="text-lg font-semibold text-gray-900">{getPlatformInfo()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm font-medium text-gray-500">Version</p>
              <p className="text-lg font-semibold text-gray-900">{appVersion || 'Loading...'}</p>
            </div>
          </div>

          {userDataPath && (
            <div className="mt-4 bg-gray-50 p-4 rounded">
              <p className="text-sm font-medium text-gray-500 mb-2">User Data Path</p>
              <code className="text-xs text-gray-700 break-all">{userDataPath}</code>
            </div>
          )}
        </div>

        {/* Persistent Storage Demo */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Persistent Storage Demo
          </h2>
          <p className="text-gray-600 mb-4">
            Test the persistent storage feature. Data saved here will persist between app restarts.
          </p>

          <div className="space-y-4">
            {/* Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Key
              </label>
              <input
                type="text"
                value={storageKey}
                onChange={(e) => setStorageKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a key"
              />
            </div>

            {/* Value Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value to Store
              </label>
              <input
                type="text"
                value={storageValue}
                onChange={(e) => setStorageValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a value to save"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Data
              </button>
              <button
                onClick={handleLoad}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Load Data
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Delete Key
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Clear All Data
              </button>
            </div>

            {/* Display Stored Data */}
            {storedData !== null && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm font-medium text-green-800 mb-2">Stored Data:</p>
                <pre className="text-sm text-green-900 bg-white p-3 rounded border border-green-200 overflow-auto">
                  {JSON.stringify(storedData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Platform Detection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Platform Detection
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${isMac() ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'}`}>
              <p className="text-center text-2xl mb-2">🍎</p>
              <p className="text-center text-sm font-medium">
                {isMac() ? 'macOS (Current)' : 'macOS'}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isWindows() ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'}`}>
              <p className="text-center text-2xl mb-2">🪟</p>
              <p className="text-center text-sm font-medium">
                {isWindows() ? 'Windows (Current)' : 'Windows'}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isLinux() ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'}`}>
              <p className="text-center text-2xl mb-2">🐧</p>
              <p className="text-center text-sm font-medium">
                {isLinux() ? 'Linux (Current)' : 'Linux'}
              </p>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Usage in Your Code
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm font-medium text-gray-700 mb-2">Import Utilities:</p>
              <code className="text-xs text-gray-800 block bg-white p-3 rounded border">
                {`import { isElectron, electronStore, electronApp } from '../lib/electron';`}
              </code>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm font-medium text-gray-700 mb-2">Check if Electron:</p>
              <code className="text-xs text-gray-800 block bg-white p-3 rounded border">
                {`if (isElectron()) {\n  // Running in desktop app\n}`}
              </code>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm font-medium text-gray-700 mb-2">Save Data:</p>
              <code className="text-xs text-gray-800 block bg-white p-3 rounded border">
                {`await electronStore.set('userPrefs', { theme: 'dark' });`}
              </code>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
