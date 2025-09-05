export function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: https://www.devicehelp.cz/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Disallow admin pages
Disallow: /admin/
Disallow: /api/

# Allow important pages
Allow: /cs/
Allow: /en/ 
Allow: /uk/
Allow: /brands/
Allow: /models/
Allow: /services/
Allow: /contact/`

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
    },
  })
}
