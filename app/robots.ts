import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/cs/', '/en/', '/uk/', '/brands/', '/models/', '/services/', '/contact/'],
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: 'https://devicehelp.cz/sitemap.xml',
    host: 'https://devicehelp.cz',
  }
}
