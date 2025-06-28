import type { ReactNode } from "react"

/**
 * Layout used only for the maintenance page.
 * It intentionally renders *nothing else* – no header, footer or other wrappers.
 */
export default function MaintenanceLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  )
}
