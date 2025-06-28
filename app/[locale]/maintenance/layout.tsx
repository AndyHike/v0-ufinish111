import type { ReactNode } from "react"

interface MaintenanceLayoutProps {
  children: ReactNode
}

export default function MaintenanceLayout({ children }: MaintenanceLayoutProps) {
  return (
    <html>
      <head>
        <title>Технічні роботи</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="overflow-hidden">{children}</body>
    </html>
  )
}
