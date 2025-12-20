import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import Head from 'next/head';
import { useEffect } from 'react';
import { initDesktopNotifications } from '../lib/desktopNotificationService';
import { preloadSounds } from '../lib/soundService';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Initialize desktop notifications
    initDesktopNotifications();
    
    // Preload notification sounds
    preloadSounds();
  }, []);

  return (
    <>
      <Head>
        <link rel="preload" href="/fonts/agency.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="icon" type="image/jpeg" href="/Fav%20Icon/Fav_Dark_JPG@4x-100.jpg" />
        <link rel="shortcut icon" type="image/jpeg" href="/Fav%20Icon/Fav_Dark_JPG@4x-100.jpg" />
        <link rel="apple-touch-icon" href="/Fav%20Icon/Fav_Dark_JPG@4x-100.jpg" />
      </Head>
      <AuthProvider>
        <WebSocketProvider>
          <Component {...pageProps} />
        </WebSocketProvider>
      </AuthProvider>
    </>
  );
}

