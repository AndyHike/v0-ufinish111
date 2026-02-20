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
  const locale = (params.locale as string) || "cs" // Default to Czech if no locale
  const currentLocale = locale
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: "uk", name: "Українська", shortCode: "UA", flag: "🇺🇦" },
    { code: "cs", name: "Čeština", shortCode: "CZ", flag: "🇨🇿" },
    { code: "en", name: "English", shortCode: "EN", flag: "🇬🇧" },
  ]

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === currentLocale) {
      setIsOpen(false)
      return
    }

    // Get the current path segments
    const segments = pathname.split("/").filter(Boolean) // Remove empty segments

    // If we're on the root (no locale in path), just prepend the new locale
    if (segments.length === 0 || !["uk", "cs", "en"].includes(segments[0])) {
      const newPath = `/${newLocale}`
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
      router.push(newPath)
      setIsOpen(false)
      return
    }

    // Replace the locale segment (first segment)
    segments[0] = newLocale

    // Reconstruct the path with the new locale
    const newPath = `/${segments.join("/")}`

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
          <span className="text-sm">{languages.find((l) => l.code === currentLocale)?.flag}</span>
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
            <span className="mr-2">{language.flag}</span>
            <span className="text-xs font-semibold text-muted-foreground mr-2">{language.shortCode}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
