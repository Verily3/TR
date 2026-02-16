/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker/Cloud Run deployment
  output: 'standalone',

  transpilePackages: ['@tr/shared'],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Enable compression
  compress: true,

  // Security headers
  // Proxy API requests to internal Hono API server (used in Docker/Cloud Run)
  // In local dev with NEXT_PUBLIC_API_URL set, browser calls API directly — these rewrites are unused
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3002/api/:path*',
      },
      {
        source: '/health',
        destination: 'http://127.0.0.1:3002/health',
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
