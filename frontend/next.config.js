/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable image optimization for Electron builds
  images: {
    unoptimized: true,
  },
  // Enable static export for Electron
  output: process.env.ELECTRON_BUILD ? 'export' : undefined,
  // Trailing slash for static export
  trailingSlash: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001/api',
    MAIN_DOMAIN: process.env.MAIN_DOMAIN || 'localhost',
  },
  async rewrites() {
    // Skip rewrites in Electron build
    if (process.env.ELECTRON_BUILD) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:3001/api'}/:path*`,
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
  webpack: (config, { isServer }) => {
    // Fixes for Electron
    if (!isServer) {
      config.target = 'electron-renderer';
    }
    return config;
  },
};

module.exports = nextConfig;

