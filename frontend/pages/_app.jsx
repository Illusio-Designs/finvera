import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" type="image/jpeg" href="/Fav%20Icon/Fav_Dark_JPG@4x-100.jpg" />
        <link rel="shortcut icon" type="image/jpeg" href="/Fav%20Icon/Fav_Dark_JPG@4x-100.jpg" />
        <link rel="apple-touch-icon" href="/Fav%20Icon/Fav_Dark_JPG@4x-100.jpg" />
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}

