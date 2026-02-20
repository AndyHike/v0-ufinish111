"use client"

import { useState } from "react"
import { usePathname, useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const pathname = usePathname()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentLocale = params.locale as string
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: "uk", name: "Українська", shortCode: "UA" },
    { code: "cs", name: "Čeština", shortCode: "CZ" },
    { code: "en", name: "English", shortCode: "EN" },
  ]

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === currentLocale) {
      setIsOpen(false)
      return
    }

    // Get the current path segments
    const segments = pathname.split("/")

    // Replace the locale segment (which should be the first segment after the initial slash)
    if (segments.length > 1) {
      segments[1] = newLocale
    }

    // Reconstruct the path with the new locale
    const newPath = segments.join("/")

    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`

    // Preserve URL parameters
    const currentParams = new URLSearchParams(searchParams.toString())
    const queryString = currentParams.toString()
    const finalPath = queryString ? `${newPath}?${queryString}` : newPath

    // Use router.push for smoother navigation
    router.push(finalPath)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className} title={`Current language: ${languages.find((l) => l.code === currentLocale)?.name}`}>
          <span className="text-xs font-semibold">{languages.find((l) => l.code === currentLocale)?.shortCode}</span>
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={currentLocale === language.code ? "font-medium bg-accent" : ""}
          >
            <span className="text-xs font-semibold text-muted-foreground mr-2">{language.shortCode}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
