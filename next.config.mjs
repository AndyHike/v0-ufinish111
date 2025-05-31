import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Make the build more permissive
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimize images for static export
  images: {
    unoptimized: true,
    domains: ['new.devicehelp.cz', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Disable source maps in production to reduce build size
  productionBrowserSourceMaps: false,
  // Оптимізація для швидшого переходу між сторінками
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    // optimizeCss: true,  // Comment out or remove this line
    scrollRestoration: true,
  },
};

export default withNextIntl(nextConfig);
