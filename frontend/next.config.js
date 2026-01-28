/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Enable static export for Electron
  output: process.env.NODE_ENV === 'production' && process.env.ELECTRON_BUILD ? 'export' : undefined,
  trailingSlash: true,
  distDir: process.env.ELECTRON_BUILD ? 'out' : '.next',
  env: {
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.finvera.solutions/api',
    NEXT_PUBLIC_UPLOAD_URL: process.env.NEXT_PUBLIC_UPLOAD_URL,
    MAIN_DOMAIN: process.env.MAIN_DOMAIN || process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'finvera.solutions',
    NEXT_PUBLIC_MAIN_DOMAIN: process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'finvera.solutions',
    NEXT_PUBLIC_UPLOADS_BASE_URL: process.env.NEXT_PUBLIC_UPLOADS_BASE_URL || 'https://api.finvera.solutions',
    NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY: process.env.NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY || 'Devils@2609',
  },
  async rewrites() {
    // Skip rewrites for Electron build
    if (process.env.ELECTRON_BUILD) {
      return [];
    }
    
    // Only add rewrite if API_URL is defined
    if (!process.env.API_URL) {
      return [];
    }
    
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL}/:path*`,
      },
    ];
  },
  // Allow subdomains in development
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

