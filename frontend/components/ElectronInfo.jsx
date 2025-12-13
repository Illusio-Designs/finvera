import { useState, useEffect } from 'react';
import { isElectron, electronApp, isMac, isWindows, isLinux } from '../lib/electron';

/**
 * ElectronInfo Component
 * Displays information about the Electron environment
 * This component can be used to show app version, platform info, etc.
 */
export default function ElectronInfo() {
  const [appInfo, setAppInfo] = useState({
    isElectron: false,
    version: null,
    platform: null,
    userDataPath: null,
  });

  useEffect(() => {
    const loadAppInfo = async () => {
      if (isElectron()) {
        const version = await electronApp.getVersion();
        const platform = electronApp.getPlatform();
        const userDataPath = await electronApp.getPath('userData');

        setAppInfo({
          isElectron: true,
          version,
          platform,
          userDataPath,
        });
      }
    };

    loadAppInfo();
  }, []);

  if (!appInfo.isElectron) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="text-blue-800">
          🌐 Running in <strong>Web Browser</strong> mode
        </p>
      </div>
    );
  }

  const getPlatformIcon = () => {
    if (isMac()) return '🍎';
    if (isWindows()) return '🪟';
    if (isLinux()) return '🐧';
    return '💻';
  };

  const getPlatformName = () => {
    if (isMac()) return 'macOS';
    if (isWindows()) return 'Windows';
    if (isLinux()) return 'Linux';
    return appInfo.platform;
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
      <h3 className="font-semibold text-green-900 flex items-center gap-2">
        {getPlatformIcon()} Desktop Application
      </h3>
      <div className="text-sm text-green-800 space-y-1">
        <p>
          <strong>Version:</strong> {appInfo.version || 'Unknown'}
        </p>
        <p>
          <strong>Platform:</strong> {getPlatformName()}
        </p>
        {appInfo.userDataPath && (
          <p className="text-xs">
            <strong>Data Path:</strong>{' '}
            <span className="font-mono text-xs break-all">
              {appInfo.userDataPath}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
