import type React from "react"
import { useSettings } from "@/context/settings"
import { cn } from "@/lib/utils"

type FooterProps = React.HTMLAttributes<HTMLElement>

export function Footer({ className, ...props }: FooterProps) {
  const { settings } = useSettings()

  return (
    <footer className={cn("border-t bg-background", className)} {...props}>
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
          {settings.siteLogo && (
            <img
              src={settings.siteLogo || "/placeholder.svg"}
              alt="DeviceHelp"
              className="h-8 w-8 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
              }}
            />
          )}
          <p className="text-center text-sm leading-loose">{settings.footerText}</p>
        </div>
      </div>
    </footer>
  )
}
