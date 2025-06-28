import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Технічні роботи",
  description: "Сайт тимчасово недоступний через технічні роботи",
}

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head />
      <body className="antialiased">{children}</body>
    </html>
  )
}
