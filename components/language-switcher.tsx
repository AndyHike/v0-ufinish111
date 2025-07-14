"use client"

import { useState } from "react"
import { usePathname, useParams, useSearchParams } from "next/navigation"
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
  const currentLocale = params.locale as string
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: "uk", name: "Українська" },
    { code: "cs", name: "Čeština" },
    { code: "en", name: "English" },
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

    // ВИПРАВЛЕНО: Зберігаємо всі URL параметри при зміні мови
    const currentParams = new URLSearchParams(searchParams.toString())
    const queryString = currentParams.toString()

    // Формуємо фінальний URL з параметрами
    const finalPath = queryString ? `${newPath}?${queryString}` : newPath

    console.log("Language change:", {
      currentLocale,
      newLocale,
      originalPath: pathname,
      newPath,
      searchParams: searchParams.toString(),
      finalPath,
    })

    // Use window.location for a full page refresh to ensure all components update
    window.location.href = finalPath

    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Globe className="h-5 w-5" />
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
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
