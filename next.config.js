const createNextIntlPlugin = require("next-intl/plugin")

module.exports = createNextIntlPlugin({
  // This is the default Next.js config
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // You can add other Next.js config options here
})
