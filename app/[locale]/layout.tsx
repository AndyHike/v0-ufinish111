import type React from "react"
import { cn } from "@/lib/utils"
import { Mona_Sans as FontSans } from "next/font/google"

import { NavigationProgress } from "@/components/navigation-progress"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

interface RootLayoutProps {
  children: React.ReactNode
  params: {
    locale: string
  }
}

export default function RootLayout({ children, params }: RootLayoutProps) {
  return (
    <html lang={params.locale}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <NavigationProgress />
        {children}
      </body>
    </html>
  )
}
