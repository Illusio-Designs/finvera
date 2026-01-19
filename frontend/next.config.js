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
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_UPLOAD_URL: process.env.NEXT_PUBLIC_UPLOAD_URL,
    MAIN_DOMAIN: process.env.MAIN_DOMAIN || process.env.NEXT_PUBLIC_MAIN_DOMAIN,
    NEXT_PUBLIC_MAIN_DOMAIN: process.env.NEXT_PUBLIC_MAIN_DOMAIN,
  },
  async rewrites() {
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
  // For client-only Electron build, redirect ALL non-client routes
  ...(process.env.ELECTRON_CLIENT_ONLY === 'true' && {
    async redirects() {
      return [
        // Redirect ALL admin routes to client login
        {
          source: '/admin/:path*',
          destination: '/client/login',
          permanent: false,
        },
        // Redirect ALL public/marketing pages to client dashboard
        {
          source: '/',
          destination: '/client/dashboard',
          permanent: false,
        },
        {
          source: '/about',
          destination: '/client/dashboard',
          permanent: false,
        },
        {
          source: '/contact',
          destination: '/client/dashboard',
          permanent: false,
        },
        {
          source: '/features',
          destination: '/client/dashboard',
          permanent: false,
        },
        {
          source: '/plans',
          destination: '/client/dashboard',
          permanent: false,
        },
        {
          source: '/use-cases',
          destination: '/client/dashboard',
          permanent: false,
        },
        {
          source: '/docs',
          destination: '/client/dashboard',
          permanent: false,
        },
        {
          source: '/help',
          destination: '/client/dashboard',
          permanent: false,
        },
        {
          source: '/privacy',
          destination: '/client/dashboard',
          permanent: false,
        },
        {
          source: '/terms',
          destination: '/client/dashboard',
          permanent: false,
        },
        // Catch-all: redirect any other non-client route to client dashboard
        {
          source: '/((?!client|auth|api|_next|favicon.ico).*)',
          destination: '/client/dashboard',
          permanent: false,
        },
      ];
    },
  }),
};

module.exports = nextConfig;

