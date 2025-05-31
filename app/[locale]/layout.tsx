import type React from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { NextAuthProvider } from "@/components/providers"

interface Props {
  children: React.ReactNode
  params: { locale: string }
}

export default async function RootLayout({ children, params: { locale } }: Props) {
  return (
    <html lang={locale}>
      <body>
        <NextAuthProvider>
          <Header />
          {children}
          <Footer />
        </NextAuthProvider>
      </body>
    </html>
  )
}
