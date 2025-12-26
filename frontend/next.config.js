/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // For Electron production builds, use standalone output
  ...(process.env.ELECTRON_BUILD === 'true' && {
    output: 'standalone',
  }),
  env: {
    API_URL: process.env.API_URL || 'https://finvera.illusiodesigns.agency/api',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://finvera.illusiodesigns.agency/api',
    NEXT_PUBLIC_UPLOAD_URL: process.env.NEXT_PUBLIC_UPLOAD_URL || 'https://finvera.illusiodesigns.agency/uploads',
    MAIN_DOMAIN: process.env.MAIN_DOMAIN || process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'finvera.illusiodesigns.agency',
    NEXT_PUBLIC_MAIN_DOMAIN: process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'finvera.solutions',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'https://finvera.illusiodesigns.agency/api'}/:path*`,
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

