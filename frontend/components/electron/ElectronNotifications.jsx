import { useState, useEffect } from 'react';
import { FiBell, FiX } from 'react-icons/fi';

const ElectronNotifications = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && window.electronAPI);
    
    // Listen for desktop notifications
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Mock notifications for demo
      const mockNotifications = [
        {
          id: 1,
          title: 'GST Return Due',
          message: 'GSTR-1 filing due in 3 days',
          type: 'warning',
          timestamp: new Date()
        },
        {
          id: 2,
          title: 'Payment Received',
          message: 'Payment of ₹50,000 received from ABC Corp',
          type: 'success',
          timestamp: new Date(Date.now() - 3600000)
        }
      ];
      setNotifications(mockNotifications);
    }
  }, []);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  if (!isElectron) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <FiBell size={20} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="p-3 border-b hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-800">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 border-t">
              <button
                onClick={() => setNotifications([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ElectronNotifications;