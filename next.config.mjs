// 👇 1. Імпортуємо плагін перекладів (Це те, чого не вистачало!)
import createNextIntlPlugin from 'next-intl/plugin';

// Створюємо обгортку (вона сама знайде файл i18n.ts у папці src)
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ігноруємо помилки
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Налаштування картинок
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: 'default',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
      },
    ],
  },

  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
  },

  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*.(webp|avif|jpg|jpeg|png)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
       {
        source: '/:path*',
        headers: [{ key: 'X-DNS-Prefetch-Control', value: 'on' }],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/cs',
        permanent: true,
      },
    ]
  },
}

// 👇 2. Обгортаємо конфігурацію в withNextIntl
export default withNextIntl(nextConfig);
