import type React from "react"
import type { Metadata } from "next"

// Додаємо canonical URL для root path
export const metadata: Metadata = {
  generator: 'v0.app',
  metadataBase: new URL('https://devicehelp.cz'),
  alternates: {
    canonical: 'https://devicehelp.cz/cs',
  },
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

import './globals.css'
