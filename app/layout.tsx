import type React from "react"

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

export const metadata = {
      generator: 'v0.app'
    };
