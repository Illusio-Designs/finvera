const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001/api',
    MAIN_DOMAIN: process.env.MAIN_DOMAIN || 'localhost',
  },
  webpack: (config, { isServer, webpack }) => {
    // Fixes for global object in client-side (browser environment)
    if (!isServer) {
      const globalPolyfillPath = path.resolve(__dirname, 'polyfills/global.js');
      const globalRuntimePath = path.resolve(__dirname, 'polyfills/global-runtime.js');
      
      // Set up resolve fallback - point global to our polyfill
      config.resolve.fallback = {
        ...config.resolve.fallback,
        global: globalPolyfillPath,
      };

      // Provide global polyfill using ProvidePlugin
      // This injects the polyfill whenever 'global' is referenced as a variable
      config.plugins.push(
        new webpack.ProvidePlugin({
          global: globalPolyfillPath,
        })
      );

      // Inject runtime polyfill at the very beginning of all entry points
      // This MUST run before webpack's runtime code
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        
        // Add polyfill to all client-side entry points
        if (entries && typeof entries === 'object') {
          Object.keys(entries).forEach((key) => {
            if (Array.isArray(entries[key])) {
              // Check if polyfill is already added
              const hasPolyfill = entries[key].some(
                (entry) => entry && (entry.includes('polyfills/global-runtime') || entry.includes('polyfills.js'))
              );
              if (!hasPolyfill) {
                entries[key].unshift(globalRuntimePath);
              }
            } else if (typeof entries[key] === 'string') {
              // Convert string entry to array
              entries[key] = [globalRuntimePath, entries[key]];
            }
          });
        }
        
        return entries;
      };

      // Use BannerPlugin as backup to inject global polyfill at the top of entry chunks
      config.plugins.push(
        new webpack.BannerPlugin({
          banner: `(function(){if(typeof global==='undefined'){var root=typeof globalThis!=='undefined'?globalThis:typeof window!=='undefined'?window:typeof self!=='undefined'?self:{};try{Object.defineProperty(root,'global',{value:root,writable:true,enumerable:false,configurable:true});if(typeof window!=='undefined')window.global=root;if(typeof globalThis!=='undefined')globalThis.global=root}catch(e){root.global=root}}})();`,
          raw: true,
          entryOnly: true,
        })
      );
    }
    return config;
  },
  async rewrites() {
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
};

module.exports = nextConfig;

