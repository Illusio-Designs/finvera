import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}

export function WebSocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!user || !token) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get WebSocket URL from environment or use default
    // Extract base URL from API URL if WS URL not specified
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://finvera.illusiodesigns.agency/api';
    const baseUrl = apiUrl.replace('/api', '');
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || baseUrl;

    // Create socket connection
    const newSocket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token,
        userId: user.id,
      },
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;

      // Join user-specific room
      newSocket.emit('join-user-room', user.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      reconnectAttemptsRef.current += 1;
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`WebSocket reconnect attempt ${attemptNumber}`);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      setConnectionError('Failed to reconnect to server');
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, token]);

  const value = {
    socket,
    isConnected,
    connectionError,
    emit: (event, data) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      }
    },
    on: (event, callback) => {
      if (socket) {
        socket.on(event, callback);
        // Return cleanup function
        return () => socket.off(event, callback);
      }
    },
    off: (event, callback) => {
      if (socket) {
        socket.off(event, callback);
      }
    },
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}
