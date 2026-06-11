// 👇 1. Імпортуємо плагін перекладів (Це те, чого не вистачало!)
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Створюємо обгортку (вона сама знайде файл i18n.ts у папці src)
const withNextIntl = createNextIntlPlugin();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Content-Security-Policy. Rolled out in Report-Only mode first: violations
// are logged to /api/csp-report (server logs) without blocking anything.
// After a clean report window, set CSP_ENFORCE=1 (build-time env) to switch
// the header to enforcing. script-src needs 'unsafe-inline' because the
// consent-mode + GTM bootstrap scripts in components/site-locale-layout.tsx
// and Next.js hydration scripts are inline; moving to nonces would require
// emitting the CSP from middleware instead.
const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-eval' is required by React Fast Refresh in dev only.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://js.stripe.com https://widget.packeta.com https://pay.google.com`,
  "style-src 'self' 'unsafe-inline'",
  // Direct <img> to Supabase Storage (articles, brands); R2 goes through the
  // same-origin /_next/image proxy; blob:/data: for admin upload previews.
  "img-src 'self' data: blob: https://*.supabase.co https://www.googletagmanager.com https://*.google-analytics.com https://*.stripe.com https://stats.g.doubleclick.net",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://widget.packeta.com",
  // Google Maps embed (contact page), Stripe Elements/3DS, Google Pay, Packeta picker.
  "frame-src https://www.google.com https://js.stripe.com https://hooks.stripe.com https://pay.google.com https://widget.packeta.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  'report-uri /api/csp-report',
].join('; ')

const cspHeader = {
  key: process.env.CSP_ENFORCE === '1' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
  value: cspDirectives,
}

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
    qualities: [75, 80, 85],
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
      // Cloudflare R2 public bucket used by the shop admin for product/category images
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        port: '',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
        port: '',
      },
    ],
  },

  output: 'standalone',
  outputFileTracingRoot: __dirname,
  compress: true,
  poweredByHeader: false,

  // Disable streaming metadata for every user agent: canonical/hreflang/meta
  // tags always render inside <head>. With streaming, HTML-only crawlers
  // (Screaming Frog, Ahrefs, …) saw them in <body> and ignored them. Cheap
  // here: catalog pages are ISR-prerendered, which never streams metadata.
  htmlLimitedBots: /.*/,

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
    optimizeCss: true,
  },

  async headers() {
    // Immutable caching is only safe in production, where /_next/static URLs
    // are content-hashed. Dev chunk URLs are stable, so a year-long immutable
    // header makes browsers keep running stale code after every edit.
    const immutableAssetHeaders =
      process.env.NODE_ENV === 'production'
        ? [
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
          ]
        : []

    return [
      ...immutableAssetHeaders,
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // Security headers (Screaming Frog audit 2026-06-12). Served by the
          // app so they hold regardless of the proxy in front (the nginx
          // template's add_header is suppressed in nested locations anyway).
          // No includeSubDomains on HSTS: only app hosts are known to be HTTPS.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          cspHeader,
        ],
      },
    ]
  },
}

// 👇 2. Обгортаємо конфігурацію в withNextIntl
export default withNextIntl(nextConfig);
