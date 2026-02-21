/**
 * Generate Article Schema (JSON-LD) for SEO
 */
export function generateArticleSchema({
  title,
  description,
  image,
  slug,
  createdAt,
  updatedAt,
  locale = "cs",
}: {
  title: string
  description: string
  image?: string
  slug: string
  createdAt: string
  updatedAt: string
  locale?: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://devicehelp.cz"
  const url = `${baseUrl}/${locale}/articles/${slug}`

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description || title,
    image: image || `${baseUrl}/default-article-image.jpg`,
    datePublished: createdAt,
    dateModified: updatedAt,
    author: {
      "@type": "Organization",
      name: "DeviceHelp",
      logo: `${baseUrl}/logo.png`,
    },
    publisher: {
      "@type": "Organization",
      name: "DeviceHelp",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    url: url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  }
}

/**
 * Generate BreadcrumbList Schema for article page
 */
export function generateArticleBreadcrumbSchema({
  title,
  slug,
  locale = "cs",
}: {
  title: string
  slug: string
  locale?: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://devicehelp.cz"

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Articles",
        item: `${baseUrl}/${locale}/articles`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${baseUrl}/${locale}/articles/${slug}`,
      },
    ],
  }
}

/**
 * Generate FAQPage Schema (if needed for future implementation)
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}
