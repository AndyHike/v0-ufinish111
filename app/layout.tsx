import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { NextAuthProvider } from "@/components/providers/session-provider"
import { DynamicFavicon } from "@/components/dynamic-favicon"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = "https://devicehelp.cz";

  return {
    title: "DeviceHelp - Profesionální oprava mobilních telefonů v Praze",
    description: "Rychlá a kvalitní oprava mobilních telefonů v Praze. Výměna displeje, baterie a další. Záruka na všechny opravy.",
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/cs`,
      languages: {
        'cs': `${baseUrl}/cs`,
        'en': `${baseUrl}/en`,
        'uk': `${baseUrl}/uk`,
        'x-default': `${baseUrl}/cs`,
      },
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <DynamicFavicon />
            {children}
            <Toaster />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
