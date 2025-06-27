"use client"

import { usePathname } from "next/navigation"

interface SeoHeadProps {
  title: string
  description: string
}

// ВИПРАВЛЕНО: нам більше не потрібен `locale` як пропс, ми беремо його з URL
export function SeoHead({ title, description }: SeoHeadProps) {
  const pathname = usePathname() // pathname тут буде /cs/page-url або /en/page-url

  // ВИПРАВЛЕНО: Канонічна URL - це просто повний шлях поточної сторінки
  const canonicalUrl = `https://devicehelp.cz${pathname}`

  // Базовий шлях для інших мов (без мовного префіксу)
  const basePath = pathname.replace(/^\/(cs|en|uk)/, "") || "/"

  // Альтернативні URL генеруються правильно
  const alternateUrls = {
    en: `https://devicehelp.cz/en${basePath}`,
    cs: `https://devicehelp.cz/cs${basePath}`,
    uk: `https://devicehelp.cz/uk${basePath}`,
  }

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={alternateUrls.en} />
      <link rel="alternate" hrefLang="cs" href={alternateUrls.cs} />
      <link rel="alternate" hrefLang="uk" href={alternateUrls.uk} />
      {/* ВИПРАВЛЕНО: мова за замовчуванням тепер чеська (cs) */}
      <link rel="alternate" hrefLang="x-default" href={alternateUrls.cs} />
    </>
  )
}
