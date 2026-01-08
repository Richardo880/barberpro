/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone para Docker (reduce tamaño de imagen)
  output: 'standalone',

  // React Strict Mode
  reactStrictMode: true,

  // Experimental features de Next.js 15
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  // Images optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com', // Si migras imágenes de Wix
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Si usas Cloudinary
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com', // Si usas S3
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
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
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },

  // Webpack config (opcional)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Reducir bundle size en cliente
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        recharts: {
          test: /[\\/]node_modules[\\/]recharts[\\/]/,
          name: 'recharts',
          chunks: 'all',
          priority: 10,
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
