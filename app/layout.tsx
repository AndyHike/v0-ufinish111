import type React from "react"
import type { Metadata } from "next"

// Metadata for root is minimal - actual metadata is set per-locale in [locale]/layout.tsx
export const metadata: Metadata = {
  generator: 'v0.app',
  metadataBase: new URL('https://devicehelp.cz'),
}

// Цей Layout є лише обгорткою-пустушкою, щоб задовольнити Next.js.
// Справжні теги <html> та <body> знаходяться в app/[locale]/layout.tsx
// globals.css також імпортується там
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
